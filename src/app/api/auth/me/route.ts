import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { getProfile } from "@/lib/db";

export async function GET() {
  const user = await getAuthUserFromRequest();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const profile = await getProfile(user.uid);
  return NextResponse.json({
    user: {
      uid: user.uid,
      email: user.email,
      display_name: profile?.display_name ?? user.name ?? "Player",
    },
  });
}
