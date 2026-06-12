"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

/** Wait until Firebase has restored persisted auth (avoids false "signed out" on mobile). */
export async function getFirebaseUser() {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser;
}

/** Authenticated fetch — sends session cookie and a fresh Firebase ID token. */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  try {
    const user = await getFirebaseUser();
    if (user) {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Cookie-only session may still work.
  }

  let res = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    try {
      const user = await getFirebaseUser();
      if (user) {
        const freshHeaders = new Headers(init?.headers);
        freshHeaders.set(
          "Authorization",
          `Bearer ${await user.getIdToken(true)}`
        );
        res = await fetch(input, {
          ...init,
          headers: freshHeaders,
          credentials: "include",
        });
      }
    } catch {
      // Return the original 401 response.
    }
  }

  return res;
}

/** True when Firebase has a signed-in user in this browser session. */
export async function isFirebaseSignedIn(): Promise<boolean> {
  return (await getFirebaseUser()) !== null;
}
