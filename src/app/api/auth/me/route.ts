import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { getProfile } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const profile = await getProfile(user.uid).catch(() => null);
  return NextResponse.json({
    user: {
      uid: user.uid,
      email: user.email,
      display_name: profile?.display_name ?? user.name ?? "Player",
    },
  });
}
