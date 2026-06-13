import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { upsertProfile } from "@/lib/db";

/** Save display name to Firestore after sign-up or sign-in. */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const displayName =
    (typeof body.displayName === "string" && body.displayName.trim()) ||
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Player";

  await upsertProfile(user.uid, displayName);

  return NextResponse.json({ ok: true, display_name: displayName });
}
