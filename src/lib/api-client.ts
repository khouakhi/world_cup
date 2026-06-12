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
  const headers = new Headers(init?.headers);

  try {
    const user = await getFirebaseUser();
    if (user) {
      headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
    }
  } catch {
    // Cookie-only session may still work.
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
