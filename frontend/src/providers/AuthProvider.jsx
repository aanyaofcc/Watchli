import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

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
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        email,
        plan: "free",
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
    return credential.user;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
