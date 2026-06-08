import {
  fetchWorldCupFixtures,
  fetchLiveWorldCupFixtures,
  type NormalisedFixture,
} from "@/lib/api-football/client";
import { calculateMatchPoints } from "@/lib/scoring";
import { evaluateBadges } from "@/lib/badges";
import { isFinishedStatus } from "@/lib/utils";
import { scoreBracketPredictions } from "@/lib/sync/bracket";
import { scoreTopThreePredictions } from "@/lib/sync/top-three";
import {
  getMatchByExternalId,
  upsertMatch,
  matchDocId,
  getPredictionsForMatch,
  getCaptainPick,
  updatePredictionPoints,
  getLeagueMembers,
  getPredictionsForLeague,
  listAllMatches,
  getCaptainPicksForLeague,
  upsertBadge,
  listSemiFinalMatches,
  getMatch,
} from "@/lib/db";
import type { Match } from "@/types";

export async function syncFixtures(): Promise<{ synced: number; updated: number }> {
  const fixtures = await fetchWorldCupFixtures();

  let synced = 0;
  let updated = 0;

  for (const fixture of fixtures) {
    const existing = await getMatchByExternalId(fixture.external_fixture_id);
    const row = fixtureToRow(fixture);

    if (existing) {
      await upsertMatch(fixture.external_fixture_id, row);
      updated += 1;

      const wasFinished = isFinishedStatus(existing.status);
      const nowFinished = isFinishedStatus(fixture.status);

      if (
        !wasFinished &&
        nowFinished &&
        fixture.home_score !== null &&
        fixture.away_score !== null
      ) {
        await scoreMatchPredictions(existing.id, fixture.home_score, fixture.away_score);

        const round = fixture.round?.toLowerCase() ?? "";
        if (round.includes("final") && !round.includes("semi") && !round.includes("3rd")) {
          await scoreBracketsFromFinal(fixture);
        }
        if (round.includes("final") || round.includes("3rd") || round.includes("third")) {
          await scoreTopThreePredictions();
        }
      }
    } else {
      await upsertMatch(fixture.external_fixture_id, row);
      synced += 1;
    }
  }

  return { synced, updated };
}

export async function syncLiveResults(): Promise<{ live: number }> {
  const liveFixtures = await fetchLiveWorldCupFixtures();

  for (const fixture of liveFixtures) {
    const existing = await getMatchByExternalId(fixture.external_fixture_id);
    if (!existing) continue;

    await upsertMatch(fixture.external_fixture_id, fixtureToRow(fixture));

    if (
      isFinishedStatus(fixture.status) &&
      !isFinishedStatus(existing.status) &&
      fixture.home_score !== null &&
      fixture.away_score !== null
    ) {
      await scoreMatchPredictions(existing.id, fixture.home_score, fixture.away_score);
    }
  }

  return { live: liveFixtures.length };
}

async function scoreMatchPredictions(
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
    await refreshBadgesForLeague(leagueId);
  }
}

async function refreshBadgesForLeague(leagueId: string): Promise<void> {
  const members = await getLeagueMembers(leagueId);
  if (!members.length) return;

  const userIds = members.map((m) => m.user_id);
  const predictions = await getPredictionsForLeague(leagueId);
  const matches = await listAllMatches();
  const captainPicks = await getCaptainPicksForLeague(leagueId);

  const earned = evaluateBadges(
    predictions,
    matches,
    captainPicks,
    userIds
  );

  for (const badge of earned) {
    await upsertBadge(
      leagueId,
      badge.user_id,
      badge.badge_type,
      badge.metadata ?? {}
    );
  }
}

function fixtureToRow(fixture: NormalisedFixture): Omit<Match, "id"> {
  return {
    external_fixture_id: fixture.external_fixture_id,
    matchday: fixture.matchday,
    round: fixture.round,
    stage: fixture.stage,
    home_team_id: fixture.home_team_id,
    home_team_name: fixture.home_team_name,
    home_team_logo: fixture.home_team_logo,
    away_team_id: fixture.away_team_id,
    away_team_name: fixture.away_team_name,
    away_team_logo: fixture.away_team_logo,
    venue: fixture.venue,
    kickoff_at: fixture.kickoff_at,
    status: fixture.status,
    home_score: fixture.home_score,
    away_score: fixture.away_score,
    home_score_halftime: fixture.home_score_halftime,
    away_score_halftime: fixture.away_score_halftime,
    is_locked: fixture.is_locked,
  };
}

async function scoreBracketsFromFinal(
  fixture: NormalisedFixture
): Promise<void> {
  if (fixture.home_score === null || fixture.away_score === null) return;

  const championId =
    fixture.home_score > fixture.away_score
      ? fixture.home_team_id
      : fixture.away_team_id;
  const runnerUpId =
    fixture.home_score > fixture.away_score
      ? fixture.away_team_id
      : fixture.home_team_id;

  const semiMatches = await listSemiFinalMatches();
  const semiFinalistIds: number[] = [];

  for (const m of semiMatches) {
    if (m.home_score === null || m.away_score === null) continue;
    if (m.home_score > m.away_score) semiFinalistIds.push(m.home_team_id);
    else semiFinalistIds.push(m.away_team_id);
  }

  await scoreBracketPredictions(championId, runnerUpId, semiFinalistIds);
}

export { refreshBadgesForLeague };
