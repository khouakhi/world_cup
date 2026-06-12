"use client";

import { useEffect, useRef } from "react";
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
  const refreshing = useRef(false);

  useEffect(() => {
    if (window.location.pathname.startsWith("/auth")) return;

    const auth = getFirebaseAuth();

    void auth.authStateReady().then(async () => {
      const user = auth.currentUser;
      if (!user || refreshing.current) return;

      refreshing.current = true;
      try {
        const idToken = await user.getIdToken();
        await refreshServerSession(idToken);
      } catch {
        // Cookie may still be valid; bearer token auth still works.
      } finally {
        refreshing.current = false;
      }
    });
  }, []);

  return <>{children}</>;
}
