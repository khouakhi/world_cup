import { NextRequest, NextResponse } from "next/server";
import { seedWorldCup2026Fixtures } from "@/lib/worldcup2026/seed";

/**
 * Seed World Cup 2026 teams and fixtures from bundled static JSON.
 * POST /api/admin/seed-worldcup2026 with Authorization: Bearer CRON_SECRET
 *
 * Optional query: ?force=1 to re-seed even when fixtures already exist.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const force = request.nextUrl.searchParams.get("force") === "1";
    const result = await seedWorldCup2026Fixtures({ force });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("World Cup 2026 seed failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
