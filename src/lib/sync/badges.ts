import { evaluateBadges } from "@/lib/badges";
import { LEGACY_DEMO_MATCH_ID } from "@/lib/constants";
import {
  getLeagueMembers,
  getPredictionsForLeague,
  getPredictionsForMatch,
  listAllMatches,
  getCaptainPicksForLeague,
  getBadgesForLeague,
  upsertBadge,
  deleteBadge,
  deletePredictionsForMatch,
  deleteCaptainPicksForMatch,
  deleteMatch,
} from "@/lib/db";

function excludeDemoMatch<T extends { match_id: string }>(items: T[]): T[] {
  return items.filter((item) => item.match_id !== LEGACY_DEMO_MATCH_ID);
}

/**
 * Re-evaluate badges from real tournament data and remove any that no longer apply.
 */
export async function syncBadgesForLeague(leagueId: string): Promise<void> {
  const members = await getLeagueMembers(leagueId);
  if (!members.length) return;

  const userIds = members.map((m) => m.user_id);
  const predictions = excludeDemoMatch(await getPredictionsForLeague(leagueId));
  const matches = (await listAllMatches()).filter((m) => m.id !== LEGACY_DEMO_MATCH_ID);
  const captainPicks = excludeDemoMatch(await getCaptainPicksForLeague(leagueId));

  const earned = evaluateBadges(predictions, matches, captainPicks, userIds);
  const earnedIds = new Set(
    earned.map((badge) => `${leagueId}_${badge.user_id}_${badge.badge_type}`)
  );

  const existing = await getBadgesForLeague(leagueId);
  for (const badge of existing) {
    if (!earnedIds.has(badge.id)) {
      await deleteBadge(badge.id);
    }
  }

  for (const badge of earned) {
    await upsertBadge(
      leagueId,
      badge.user_id,
      badge.badge_type,
      badge.metadata ?? {}
    );
  }
}

/** Remove leftover demo match data from Firestore. Safe to run repeatedly. */
export async function purgeLegacyDemoData(): Promise<void> {
  const predictions = await getPredictionsForMatch(LEGACY_DEMO_MATCH_ID);
  if (predictions.length > 0) {
    await deletePredictionsForMatch(LEGACY_DEMO_MATCH_ID);
  }

  await deleteCaptainPicksForMatch(LEGACY_DEMO_MATCH_ID);
  await deleteMatch(LEGACY_DEMO_MATCH_ID);
}
