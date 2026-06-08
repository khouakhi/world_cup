import { NextRequest, NextResponse } from "next/server";
import { syncFixtures, syncLiveResults } from "@/lib/sync/fixtures";
import { generateUpcomingPreviews } from "@/lib/sync/previews";

/**
 * Manual sync endpoint for local development.
 * POST /api/admin/sync with Authorization: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const fixtures = await syncFixtures();
    const live = await syncLiveResults();
    const previews = await generateUpcomingPreviews();

    return NextResponse.json({
      ok: true,
      fixtures,
      live,
      previews,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
