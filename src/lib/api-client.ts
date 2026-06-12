"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

/** Wait until Firebase has restored persisted auth (avoids false "signed out" on mobile). */
async function getFirebaseUser() {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser;
}

/** Authenticated fetch — sends session cookie and Firebase ID token (PWA fallback). */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  async function request(forceRefresh: boolean) {
    const headers = new Headers(init?.headers);
    const user = await getFirebaseUser();

    if (user) {
      const token = await user.getIdToken(forceRefresh);
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  }

  try {
    let res = await request(false);

    // createSessionCookie revokes the cached ID token — fetch a fresh one and retry.
    if (res.status === 401) {
      const user = await getFirebaseUser();
      if (user) {
        res = await request(true);
      }
    }

    return res;
  } catch {
    return fetch(input, { ...init, credentials: "include" });
  }
}
