import {
  fetchWorldCupMatches,
  fetchLiveAndFinishedWorldCupMatches,
  type NormalisedFootballDataMatch,
} from "@/lib/football-data/client";
import { getFootballDataApiToken } from "@/lib/football-data/config";
import { calculateMatchPoints } from "@/lib/scoring";
import { isFinishedStatus } from "@/lib/utils";
import { scoreBracketPredictions } from "@/lib/sync/bracket";
import { syncBadgesForLeague } from "@/lib/sync/badges";
import { ensureWorldCup2026Seeded } from "@/lib/worldcup2026/seed";
import {
  buildTeamNameIndex,
  resolveWc26TeamId,
} from "@/lib/worldcup2026/normalise";
import {
  getMatch,
  getMatchByFootballDataId,
  findMatchByTeams,
  listAllMatches,
  updateMatchLiveData,
  getPredictionsForMatch,
  getCaptainPicksForMatchday,
  updatePredictionPoints,
  listSemiFinalMatches,
} from "@/lib/db";
import type { Match } from "@/types";

/**
 * Sync kickoff times, venues, and scores from football-data.org into seeded
 * World Cup 2026 fixtures. Static JSON provides structure; this API supplies
 * correct UTC kickoffs and live results.
 */
export async function syncFixtures(): Promise<{
  synced: number;
  updated: number;
  unmatched: number;
}> {
  await ensureWorldCup2026Seeded();

  if (!getFootballDataApiToken()) {
    return { synced: 0, updated: 0, unmatched: 0 };
  }

  let fixtures: NormalisedFootballDataMatch[] = [];
  try {
    fixtures = await fetchWorldCupMatches();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("FOOTBALL_DATA_API_TOKEN")) {
      return { synced: 0, updated: 0, unmatched: 0 };
    }
    throw error;
  }

  const nameIndex = buildTeamNameIndex();
  let updated = 0;
  let unmatched = 0;
  const unmatchedFixtures: NormalisedFootballDataMatch[] = [];

  for (const fixture of fixtures) {
    const result = await applyFootballDataUpdate(fixture, nameIndex);
    if (result === "updated") updated += 1;
    else if (result === "unmatched") {
      unmatched += 1;
      unmatchedFixtures.push(fixture);
    }
  }

  const knockoutUpdated = await syncKnockoutPlaceholderFixtures(
    unmatchedFixtures,
    nameIndex
  );
  updated += knockoutUpdated;
  unmatched -= knockoutUpdated;

  await refreshWorldCupMatchdaysMetadata();

  return { synced: 0, updated, unmatched };
}

async function refreshWorldCupMatchdaysMetadata(): Promise<void> {
  const { listMatchdays } = await import("@/lib/db");
  const { saveWorldCupMetadata } = await import("@/lib/worldcup2026/metadata");
  const matchdays = await listMatchdays();
  await saveWorldCupMetadata({ matchdays, seeded: true, fixture_count: 104 });
}

export async function syncLiveResults(): Promise<{ live: number; updated: number }> {
  await ensureWorldCup2026Seeded();

  if (!getFootballDataApiToken()) {
    return { live: 0, updated: 0 };
  }

  let fixtures: NormalisedFootballDataMatch[] = [];
  try {
    fixtures = await fetchLiveAndFinishedWorldCupMatches();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("FOOTBALL_DATA_API_TOKEN")) {
      return { live: 0, updated: 0 };
    }
    throw error;
  }

  const nameIndex = buildTeamNameIndex();
  let updated = 0;

  for (const fixture of fixtures) {
    const result = await applyFootballDataUpdate(fixture, nameIndex);
    if (result === "updated") updated += 1;
  }

  return { live: fixtures.length, updated };
}

type ApplyResult = "updated" | "unmatched" | "skipped";

async function applyFootballDataUpdate(
  fixture: NormalisedFootballDataMatch,
  nameIndex: Map<string, number>,
  existingOverride?: Match
): Promise<ApplyResult> {
  const existing =
    existingOverride ??
    (await getMatchByFootballDataId(fixture.football_data_match_id)) ??
    (await findMatchingSeededMatch(fixture, nameIndex));

  if (!existing) return "unmatched";

  await writeFootballDataToMatch(existing, fixture, nameIndex);
  return "updated";
}

async function writeFootballDataToMatch(
  existing: Match,
  fixture: NormalisedFootballDataMatch,
  nameIndex: Map<string, number>
): Promise<void> {
  const wasFinished = isFinishedStatus(existing.status);
  const nowFinished = isFinishedStatus(fixture.status);

  const homeId = resolveTeamId(fixture.home_team_name, fixture.home_team_tla, nameIndex);
  const awayId = resolveTeamId(fixture.away_team_name, fixture.away_team_tla, nameIndex);

  await updateMatchLiveData(existing.id, {
    football_data_match_id: fixture.football_data_match_id,
    matchday: fixture.matchday,
    round: fixture.round,
    stage: fixture.stage,
    status: fixture.status,
    home_score: fixture.home_score,
    away_score: fixture.away_score,
    home_score_halftime: fixture.home_score_halftime,
    away_score_halftime: fixture.away_score_halftime,
    is_locked: fixture.is_locked,
    kickoff_at: fixture.kickoff_at,
    venue: fixture.venue,
    ...(homeId
      ? {
          home_team_id: homeId,
          home_team_name: fixture.home_team_name,
          home_team_logo: fixture.home_team_logo ?? existing.home_team_logo,
        }
      : {}),
    ...(awayId
      ? {
          away_team_id: awayId,
          away_team_name: fixture.away_team_name,
          away_team_logo: fixture.away_team_logo ?? existing.away_team_logo,
        }
      : {}),
  });

  if (
    nowFinished &&
    fixture.home_score !== null &&
    fixture.away_score !== null
  ) {
    await scoreMatchPredictions(
      existing.id,
      fixture.home_score,
      fixture.away_score,
      { onlyUnscored: wasFinished }
    );

    const round = existing.round?.toLowerCase() ?? fixture.round?.toLowerCase() ?? "";
    if (round.includes("final") && !round.includes("semi") && !round.includes("3rd")) {
      const match = await getMatch(existing.id);
      if (match) {
        await scoreBracketsFromFinal(match, fixture.home_score, fixture.away_score);
      }
    }
  }
}

/** Pair knockout placeholders (TBD teams) by schedule order. */
async function syncKnockoutPlaceholderFixtures(
  unmatchedFixtures: NormalisedFootballDataMatch[],
  nameIndex: Map<string, number>
): Promise<number> {
  const placeholders = unmatchedFixtures.filter(
    (fixture) =>
      !resolveTeamId(fixture.home_team_name, fixture.home_team_tla, nameIndex) ||
      !resolveTeamId(fixture.away_team_name, fixture.away_team_tla, nameIndex)
  );

  if (!placeholders.length) return 0;

  const staticTbd = (await listAllMatches())
    .filter((m) => m.home_team_id === 0 && !m.football_data_match_id)
    .sort((a, b) => a.external_fixture_id - b.external_fixture_id);

  const sortedApi = [...placeholders].sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );

  let updated = 0;
  for (let i = 0; i < Math.min(staticTbd.length, sortedApi.length); i++) {
    await writeFootballDataToMatch(staticTbd[i], sortedApi[i], nameIndex);
    updated += 1;
  }

  return updated;
}

function resolveTeamId(
  name: string,
  tla: string | null,
  nameIndex: Map<string, number>
): number | null {
  if (tla) {
    const byTla = nameIndex.get(tla.toLowerCase());
    if (byTla) return byTla;
  }
  if (!name) return null;
  return resolveWc26TeamId(name, nameIndex);
}

async function findMatchingSeededMatch(
  fixture: NormalisedFootballDataMatch,
  nameIndex: Map<string, number>
): Promise<Match | null> {
  const homeId = resolveTeamId(fixture.home_team_name, fixture.home_team_tla, nameIndex);
  const awayId = resolveTeamId(fixture.away_team_name, fixture.away_team_tla, nameIndex);

  if (!homeId || !awayId || homeId === 0 || awayId === 0) {
    return null;
  }

  return findMatchByTeams(homeId, awayId);
}

export async function scoreUnscoredFinishedMatches(): Promise<number> {
  const matches = await listAllMatches();
  let scoredMatches = 0;

  for (const match of matches) {
    if (!isFinishedStatus(match.status)) continue;
    if (match.home_score === null || match.away_score === null) continue;

    const predictions = await getPredictionsForMatch(match.id);
    const needsScoring = predictions.some(
      (pred) => pred.points_awarded === null && !pred.scoring_excluded
    );
    if (!needsScoring) continue;

    await scoreMatchPredictions(match.id, match.home_score, match.away_score, {
      onlyUnscored: true,
    });
    scoredMatches += 1;
  }

  return scoredMatches;
}

export async function scoreMatchPredictions(
  matchId: string,
  homeScore: number,
  awayScore: number,
  options?: { onlyUnscored?: boolean }
): Promise<void> {
  const predictions = await getPredictionsForMatch(matchId);
  if (!predictions.length) return;

  const match = await getMatch(matchId);
  const matchday = match?.matchday ?? "";
  const captainPicks = matchday
    ? await getCaptainPicksForMatchday(matchday)
    : [];
  const captainByUserLeague = new Map(
    captainPicks.map((pick) => [`${pick.league_id}_${pick.user_id}`, pick.match_id])
  );

  let scoredAny = false;

  for (const pred of predictions) {
    if (pred.scoring_excluded) continue;
    if (options?.onlyUnscored && pred.points_awarded !== null) continue;

    const isCaptain =
      captainByUserLeague.get(`${pred.league_id}_${pred.user_id}`) === matchId;

    const breakdown = calculateMatchPoints(
      pred.home_score,
      pred.away_score,
      homeScore,
      awayScore,
      isCaptain
    );

    await updatePredictionPoints(pred.id, breakdown.totalPoints);
    scoredAny = true;
  }

  if (!scoredAny) return;

  const leagueIds = [...new Set(predictions.map((p) => p.league_id))];
  for (const leagueId of leagueIds) {
    await syncBadgesForLeague(leagueId);
  }
}

async function scoreBracketsFromFinal(
  match: Match,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const championId =
    homeScore > awayScore ? match.home_team_id : match.away_team_id;
  const runnerUpId =
    homeScore > awayScore ? match.away_team_id : match.home_team_id;

  const semiMatches = await listSemiFinalMatches();
  const semiFinalistIds: number[] = [];

  for (const m of semiMatches) {
    if (m.home_score === null || m.away_score === null) continue;
    if (m.home_score > m.away_score) semiFinalistIds.push(m.home_team_id);
    else semiFinalistIds.push(m.away_team_id);
  }

  await scoreBracketPredictions(championId, runnerUpId, semiFinalistIds);
}

export { syncBadgesForLeague } from "@/lib/sync/badges";
