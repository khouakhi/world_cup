"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { refreshServerSession } from "@/lib/firebase/session-client";

/**
 * Background session cookie refresh — never blocks sign-in.
 * Runs a few seconds after auth is detected so it does not race with login.
 */
export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || window.location.pathname.startsWith("/auth")) return;

      window.setTimeout(async () => {
        if (!auth.currentUser) return;
        try {
          const idToken = await auth.currentUser.getIdToken(true);
          await refreshServerSession(idToken);
        } catch {
          // Bearer token auth still works without the cookie.
        }
      }, 4000);
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
