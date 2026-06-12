"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

let authInitPromise: Promise<User | null> | null = null;

/** Wait for Firebase to restore persisted auth (needed on mobile PWA cold start). */
function getFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        authInitPromise = null;
        resolve(user);
      });
    });
  }

  return authInitPromise;
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
