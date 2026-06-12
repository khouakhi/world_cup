"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

let refreshInFlight: Promise<void> | null = null;

export async function refreshServerSession(
  idToken: string,
  displayName?: string,
  signal?: AbortSignal
): Promise<void> {
  const run = async () => {
    let token = idToken;

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, displayName }),
        signal,
        credentials: "include",
      });

      if (res.ok) return;

      const auth = getFirebaseAuth();
      if (auth.currentUser && attempt === 0) {
        token = await auth.currentUser.getIdToken(true);
        continue;
      }

      const data = await res.json().catch(() => ({}));
      throw new Error(
        (data as { error?: string }).error ?? "Could not refresh session"
      );
    }
  };

  if (!refreshInFlight) {
    refreshInFlight = run().finally(() => {
      refreshInFlight = null;
    });
  }

  await refreshInFlight;
}
