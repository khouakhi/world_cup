import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

export async function getAuthUserFromRequest(
  request?: NextRequest
): Promise<AuthUser | null> {
  const sessionCookie =
    request?.cookies.get(SESSION_COOKIE_NAME)?.value ??
    (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(
        sessionCookie,
        true
      );
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      // Session cookie invalid — try Bearer token below.
    }
  }

  const authHeader = request?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!bearerToken) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(bearerToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000; // 14 days (Firebase max)
