import { getFootballDataApiToken } from "@/lib/football-data/config";
import { isFinishedStatus } from "@/lib/utils";
import type { Match } from "@/types";
import { syncLiveResults } from "@/lib/sync/fixtures";

const STALE_AFTER_KICKOFF_MS = 2 * 60 * 60 * 1000;

/** Pull finished scores from football-data.org when a matchday has stale fixtures. */
export async function ensureRecentResultsSynced(
  matches: Match[]
): Promise<void> {
  if (!getFootballDataApiToken()) return;

  const needsSync = matches.some((match) => {
    const kickoff = new Date(match.kickoff_at).getTime();
    const stale =
      Date.now() > kickoff + STALE_AFTER_KICKOFF_MS && !isFinishedStatus(match.status);
    const missingScores =
      isFinishedStatus(match.status) &&
      (match.home_score === null || match.away_score === null);
    return stale || missingScores;
  });

  if (!needsSync) return;

  try {
    await syncLiveResults();
  } catch (error) {
    console.error("Recent result sync failed:", error);
  }
}
