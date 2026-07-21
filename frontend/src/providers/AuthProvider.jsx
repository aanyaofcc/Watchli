import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  paused: false,
  priceIncrease: true,
  priceDecrease: true,
  outOfStock: true
};

const AuthContext = createContext(null);

function getAuthErrorCode(error) {
  if (!error) {
    return "";
  }

  return String(error.code || error.message || "").toLowerCase();
}

function formatAuthError(error, fallbackMessage) {
  const code = getAuthErrorCode(error);

  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password.";
  }

  if (code.includes("invalid-email")) {
    return "Enter a valid email address.";
  }

  if (code.includes("email-already-in-use")) {
    return "An account with that email already exists.";
  }

  if (code.includes("weak-password")) {
    return "Choose a stronger password with at least 6 characters.";
  }

  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (code.includes("network-request-failed")) {
    return "Network error. Check your internet connection and try again.";
  }

  if (code.includes("missing-password")) {
    return "Enter your password.";
  }

  if (code.includes("missing-email")) {
    return "Enter your email address.";
  }

  return fallbackMessage;
}

function getPasswordResetSettings() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    url: `${window.location.origin}/login?reset=complete`,
    handleCodeInApp: false
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          email,
          plan: "free",
          createdAt: serverTimestamp(),
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES
        },
        { merge: true }
      );
      return credential.user;
    } catch (error) {
      throw new Error(formatAuthError(error, "Could not create your account."));
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(formatAuthError(error, "Could not log you in."));
    }
  };

  const resetPassword = async (email) => {
    try {
      return await sendPasswordResetEmail(auth, email, getPasswordResetSettings());
    } catch (error) {
      throw new Error(formatAuthError(error, "Could not send reset email."));
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
