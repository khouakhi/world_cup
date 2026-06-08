import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { upsertProfile } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken, displayName } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const decoded = await getAdminAuth().verifyIdToken(idToken);

    if (displayName) {
      await upsertProfile(decoded.uid, displayName);
    } else if (decoded.name) {
      await upsertProfile(decoded.uid, decoded.name);
    } else if (decoded.email) {
      await upsertProfile(decoded.uid, decoded.email.split("@")[0]);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session creation failed:", error);

    const message =
      error instanceof Error ? error.message : "Session creation failed";

    const isConfigError =
      message.includes("FIREBASE_SERVICE_ACCOUNT") ||
      message.includes("ENOENT") ||
      message.includes("Unexpected token");

    return NextResponse.json(
      {
        error: isConfigError
          ? "Server setup incomplete. Check FIREBASE_SERVICE_ACCOUNT_PATH in .env.local (see FIREBASE_SETUP.md Step 4)."
          : "Could not sign you in. Stop the app (Ctrl+C), run npm run dev again, and retry.",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
