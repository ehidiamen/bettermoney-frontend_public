"use client"; // ✅ Ensures this runs on the client side

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/firebase"; // Ensure the correct path

// Define the type for authentication context
interface AuthContextType {
  currentUser: User | null;
}

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for accessing AuthContext
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Define props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = { currentUser };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
