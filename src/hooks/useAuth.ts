import { useEffect, useState } from "react";

export type UserRole = "user" | "admin";

export type AuthSession = {
  name: string;
  role: UserRole;
  userId: string;
};

const STORAGE_KEY = "sahaara-auth-session";

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    return null;
  }
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const signIn = (nextSession: AuthSession) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const signOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return { session, ready, signIn, signOut };
}
