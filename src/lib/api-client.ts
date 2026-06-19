"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { refreshServerSession } from "@/lib/firebase/session-client";

/** Wait until Firebase has restored persisted auth (avoids false "signed out" on mobile). */
export async function getFirebaseUser() {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser;
}

async function attachAuthHeaders(
  headers: Headers,
  forceRefresh: boolean
): Promise<void> {
  const user = await getFirebaseUser();
  if (!user) return;

  const token = await user.getIdToken(forceRefresh);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Firebase-Token", token);
}

/** Authenticated fetch — reuses cached Firebase token unless the server returns 401. */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  try {
    await attachAuthHeaders(headers, false);
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
      const freshHeaders = new Headers(init?.headers);
      await attachAuthHeaders(freshHeaders, true);
      res = await fetch(input, {
        ...init,
        headers: freshHeaders,
        credentials: "include",
      });
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

/** Establish a server session cookie — call once after sign-in. */
export async function ensureServerSession(): Promise<void> {
  const user = await getFirebaseUser();
  if (!user) return;

  const token = await user.getIdToken(true);
  await refreshServerSession(token);
}
