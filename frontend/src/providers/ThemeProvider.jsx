import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DEFAULT_APP_THEME_ID, APP_THEMES, getAppThemeById } from "../lib/themes";
import { useAuth } from "./AuthProvider";

const THEME_STORAGE_KEY = "watchli-app-theme";

const ThemeContext = createContext(null);

function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.watchliTheme = theme.id;

  Object.entries(theme.values).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [themeId, setThemeIdState] = useState(DEFAULT_APP_THEME_ID);

  const theme = useMemo(() => getAppThemeById(themeId), [themeId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedThemeId) {
      setThemeIdState(getAppThemeById(storedThemeId).id);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    }
  }, [theme]);

  useEffect(() => {
    let active = true;

    async function loadUserTheme() {
      if (!user?.uid) {
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (!active || !snapshot.exists()) {
          return;
        }

        const savedThemeId = snapshot.data()?.appTheme;

        if (savedThemeId) {
          setThemeIdState(getAppThemeById(savedThemeId).id);
        }
      } catch {
        // If theme loading fails, keep the locally stored or default theme.
      }
    }

    void loadUserTheme();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const setThemeId = (nextThemeId) => {
    setThemeIdState(getAppThemeById(nextThemeId).id);
  };

  const saveThemePreference = async (nextThemeId) => {
    const resolvedThemeId = getAppThemeById(nextThemeId).id;
    setThemeIdState(resolvedThemeId);

    if (!user?.uid) {
      return resolvedThemeId;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        appTheme: resolvedThemeId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return resolvedThemeId;
  };

  const value = useMemo(
    () => ({
      themeId,
      theme,
      themes: APP_THEMES,
      setThemeId,
      saveThemePreference
    }),
    [theme, themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
