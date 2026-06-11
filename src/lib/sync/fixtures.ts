import {
  fetchWorldCupFixtures,
  fetchLiveWorldCupFixtures,
  type NormalisedFixture,
} from "@/lib/api-football/client";
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
  getMatchByApiFootballId,
  findMatchByTeamsAndDate,
  updateMatchLiveData,
  getPredictionsForMatch,
  getCaptainPick,
  updatePredictionPoints,
  listSemiFinalMatches,
} from "@/lib/db";
import type { Match } from "@/types";

/**
 * Sync live scores from API-Football into seeded World Cup 2026 fixtures.
 * Static schedule comes from worldcup2026 JSON; this only updates results.
 */
export async function syncFixtures(): Promise<{
  synced: number;
  updated: number;
  unmatched: number;
}> {
  await ensureWorldCup2026Seeded();

  let fixtures: NormalisedFixture[] = [];
  try {
    fixtures = await fetchWorldCupFixtures();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("free plan") ||
      message.includes("season") ||
      message.includes("API_FOOTBALL_KEY")
    ) {
      return { synced: 0, updated: 0, unmatched: 0 };
    }
    throw error;
  }

  const nameIndex = buildTeamNameIndex();
  let updated = 0;
  let unmatched = 0;

  for (const fixture of fixtures) {
    const result = await applyApiFootballUpdate(fixture, nameIndex);
    if (result === "updated") updated += 1;
    else if (result === "unmatched") unmatched += 1;
  }

  return { synced: 0, updated, unmatched };
}

export async function syncLiveResults(): Promise<{ live: number; updated: number }> {
  await ensureWorldCup2026Seeded();

  let liveFixtures: NormalisedFixture[] = [];
  try {
    liveFixtures = await fetchLiveWorldCupFixtures();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("free plan") ||
      message.includes("season") ||
      message.includes("API_FOOTBALL_KEY")
    ) {
      return { live: 0, updated: 0 };
    }
    throw error;
  }

  const nameIndex = buildTeamNameIndex();
  let updated = 0;

  for (const fixture of liveFixtures) {
    const result = await applyApiFootballUpdate(fixture, nameIndex);
    if (result === "updated") updated += 1;
  }

  return { live: liveFixtures.length, updated };
}

type ApplyResult = "updated" | "unmatched" | "skipped";

async function applyApiFootballUpdate(
  fixture: NormalisedFixture,
  nameIndex: Map<string, number>
): Promise<ApplyResult> {
  let existing =
    (await getMatchByApiFootballId(fixture.external_fixture_id)) ??
    (await findMatchingSeededMatch(fixture, nameIndex));

  if (!existing) return "unmatched";

  const wasFinished = isFinishedStatus(existing.status);
  const nowFinished = isFinishedStatus(fixture.status);

  await updateMatchLiveData(existing.id, {
    api_football_fixture_id: fixture.external_fixture_id,
    status: fixture.status,
    home_score: fixture.home_score,
    away_score: fixture.away_score,
    home_score_halftime: fixture.home_score_halftime,
    away_score_halftime: fixture.away_score_halftime,
    is_locked: fixture.is_locked,
    kickoff_at: fixture.kickoff_at,
    ...(resolveWc26TeamId(fixture.home_team_name, nameIndex)
      ? {
          home_team_id: resolveWc26TeamId(fixture.home_team_name, nameIndex)!,
          home_team_name: fixture.home_team_name,
          home_team_logo: fixture.home_team_logo,
        }
      : {}),
    ...(resolveWc26TeamId(fixture.away_team_name, nameIndex)
      ? {
          away_team_id: resolveWc26TeamId(fixture.away_team_name, nameIndex)!,
          away_team_name: fixture.away_team_name,
          away_team_logo: fixture.away_team_logo,
        }
      : {}),
  });

  if (
    !wasFinished &&
    nowFinished &&
    fixture.home_score !== null &&
    fixture.away_score !== null
  ) {
    await scoreMatchPredictions(existing.id, fixture.home_score, fixture.away_score);

    const round = existing.round?.toLowerCase() ?? fixture.round?.toLowerCase() ?? "";
    if (round.includes("final") && !round.includes("semi") && !round.includes("3rd")) {
      await scoreBracketsFromFinal(existing, fixture.home_score, fixture.away_score);
    }
  }

  return "updated";
}

async function findMatchingSeededMatch(
  fixture: NormalisedFixture,
  nameIndex: Map<string, number>
): Promise<Match | null> {
  const homeId =
    resolveWc26TeamId(fixture.home_team_name, nameIndex) ?? fixture.home_team_id;
  const awayId =
    resolveWc26TeamId(fixture.away_team_name, nameIndex) ?? fixture.away_team_id;

  if (!homeId || !awayId || homeId === 0 || awayId === 0) {
    return null;
  }

  const kickoffDate = fixture.kickoff_at.split("T")[0];
  return findMatchByTeamsAndDate(homeId, awayId, kickoffDate);
}

export async function scoreMatchPredictions(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const predictions = await getPredictionsForMatch(matchId);
  if (!predictions.length) return;

  const match = await getMatch(matchId);
  const matchday = match?.matchday ?? "";

  for (const pred of predictions) {
    const captainPick = await getCaptainPick(
      pred.league_id,
      pred.user_id,
      matchday
    );

    const breakdown = calculateMatchPoints(
      pred.home_score,
      pred.away_score,
      homeScore,
      awayScore,
      captainPick?.match_id === matchId
    );

    await updatePredictionPoints(pred.id, breakdown.totalPoints);
  }

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
