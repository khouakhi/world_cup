import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserByEmail } from "@/lib/admin/delete-user";
import { isLeagueAdmin } from "@/lib/constants";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";

const bodySchema = z.object({
  email: z.string().email(),
});

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * DELETE test users — organiser session or CRON_SECRET.
 * POST { "email": "user@example.com" }
 */
export async function POST(request: NextRequest) {
  const cronOk = verifyCronSecret(request);
  if (!cronOk) {
    const user = await getAuthUserFromRequest(request);
    if (!user || !isLeagueAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    const result = await deleteUserByEmail(parsed.data.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
