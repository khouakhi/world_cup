import { NextRequest, NextResponse } from "next/server";
import { syncLiveResults, scoreUnscoredFinishedMatches } from "@/lib/sync/fixtures";
import { saveWorldCupMetadata } from "@/lib/worldcup2026/metadata";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await syncLiveResults();
    await scoreUnscoredFinishedMatches();
    const syncedAt = new Date().toISOString();
    await saveWorldCupMetadata({ results_synced_at: syncedAt });
    return NextResponse.json({ ok: true, results_synced_at: syncedAt, ...result });
  } catch (error) {
    console.error("Live sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
