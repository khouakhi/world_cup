import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

function getBearerToken(request?: NextRequest): string | null {
  const authHeader =
    request?.headers.get("authorization") ??
    request?.headers.get("x-firebase-token");

  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
}

export async function getAuthUserFromRequest(
  request?: NextRequest
): Promise<AuthUser | null> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(bearerToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      // Fall through to session cookie below.
    }
  }

  const sessionCookie =
    request?.cookies.get(SESSION_COOKIE_NAME)?.value ??
    (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

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
    return null;
  }
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 13 * 1000; // 13 days (under Firebase 14-day max)
