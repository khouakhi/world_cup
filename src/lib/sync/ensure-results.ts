import { getFootballDataApiToken } from "@/lib/football-data/config";
import { isFinishedStatus, isLiveStatus } from "@/lib/utils";
import type { Match } from "@/types";
import { listAllMatches } from "@/lib/db";
import {
  scoreUnscoredFinishedMatches,
  syncLiveResults,
} from "@/lib/sync/fixtures";
import {
  getWorldCupMetadata,
  saveWorldCupMetadata,
} from "@/lib/worldcup2026/metadata";

const STALE_AFTER_KICKOFF_MS = 2 * 60 * 60 * 1000;
const RECENT_MATCH_WINDOW_MS = 8 * 60 * 60 * 1000;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
const SCORING_COOLDOWN_MS = 2 * 60 * 1000;

function matchNeedsApiSync(match: Match): boolean {
  const kickoff = new Date(match.kickoff_at).getTime();
  const now = Date.now();

  if (isLiveStatus(match.status)) return true;

  const inRecentWindow =
    now >= kickoff - 30 * 60 * 1000 && now <= kickoff + RECENT_MATCH_WINDOW_MS;
  const stale =
    now > kickoff + STALE_AFTER_KICKOFF_MS && !isFinishedStatus(match.status);
  const missingScores =
    isFinishedStatus(match.status) &&
    (match.home_score === null || match.away_score === null);

  return inRecentWindow || stale || missingScores;
}

/**
 * Backfill points for finished matches, pull live scores when needed, and
 * return when results were last synced from the API.
 */
export async function syncResultsIfNeeded(
  matches?: Match[],
  options?: { skipSync?: boolean }
): Promise<string> {
  const checkedAt = new Date().toISOString();
  const meta = await getWorldCupMetadata();
  const lastScoringRun = meta?.scoring_checked_at
    ? new Date(meta.scoring_checked_at).getTime()
    : 0;
  const scoringCooledDown =
    Date.now() - lastScoringRun >= SCORING_COOLDOWN_MS;

  if (!options?.skipSync && scoringCooledDown) {
    await scoreUnscoredFinishedMatches();
    await saveWorldCupMetadata({ scoring_checked_at: checkedAt });
  }

  const lastApiSync = meta?.results_synced_at
    ? new Date(meta.results_synced_at).getTime()
    : 0;
  const cooledDown = Date.now() - lastApiSync >= SYNC_COOLDOWN_MS;

  if (options?.skipSync || !getFootballDataApiToken()) {
    return meta?.results_synced_at ?? checkedAt;
  }

  const matchList = matches ?? (await listAllMatches());
  const needsApiSync = matchList.some(matchNeedsApiSync);

  if (!needsApiSync || !cooledDown) {
    return meta?.results_synced_at ?? checkedAt;
  }

  try {
    await syncLiveResults();
    await scoreUnscoredFinishedMatches();
    const syncedAt = new Date().toISOString();
    await saveWorldCupMetadata({
      results_synced_at: syncedAt,
      scoring_checked_at: syncedAt,
    });
    return syncedAt;
  } catch (error) {
    console.error("Recent result sync failed:", error);
    return meta?.results_synced_at ?? checkedAt;
  }
}

/** @deprecated Use syncResultsIfNeeded */
export async function ensureRecentResultsSynced(
  matches: Match[]
): Promise<void> {
  await syncResultsIfNeeded(matches);
}
