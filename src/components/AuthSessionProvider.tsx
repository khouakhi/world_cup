"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { refreshServerSession } from "@/lib/firebase/session-client";

/**
 * Keeps the server session cookie in sync with Firebase's persisted client auth
 * so users stay signed in across visits without re-entering credentials.
 */
export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        await refreshServerSession(idToken);
      } catch {
        // Cookie may still be valid; user can sign in again if not.
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
