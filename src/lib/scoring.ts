import type { MatchStatus } from "@/types";

export interface ScoreBreakdown {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  reason: "exact" | "goal_difference" | "result" | "none";
}

/**
 * Tiered scoring:
 * - Exact score: 5 points
 * - Correct goal difference (not exact): 2 points
 * - Correct result only: 1 point
 * Captain's pick applies 2× multiplier.
 */
export function calculateMatchPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  isCaptainPick: boolean
): ScoreBreakdown {
  const predResult = getResult(predictedHome, predictedAway);
  const actualResult = getResult(actualHome, actualAway);
  const predDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  let basePoints = 0;
  let reason: ScoreBreakdown["reason"] = "none";

  if (predictedHome === actualHome && predictedAway === actualAway) {
    basePoints = 5;
    reason = "exact";
  } else if (predDiff === actualDiff && predResult === actualResult) {
    basePoints = 2;
    reason = "goal_difference";
  } else if (predResult === actualResult) {
    basePoints = 1;
    reason = "result";
  }

  const multiplier = isCaptainPick ? 2 : 1;

  return {
    basePoints,
    multiplier,
    totalPoints: basePoints * multiplier,
    reason,
  };
}

function getResult(home: number, away: number): "H" | "D" | "A" {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

export interface BracketScoreInput {
  championTeamId: number | null;
  runnerUpTeamId: number | null;
  semiFinalistIds: number[];
  actualChampionId: number | null;
  actualRunnerUpId: number | null;
  actualSemiFinalistIds: number[];
}

export function calculateBracketPoints(input: BracketScoreInput): number {
  let points = 0;

  if (
    input.championTeamId &&
    input.actualChampionId &&
    input.championTeamId === input.actualChampionId
  ) {
    points += 20;
  }

  if (
    input.runnerUpTeamId &&
    input.actualRunnerUpId &&
    input.runnerUpTeamId === input.actualRunnerUpId
  ) {
    points += 10;
  }

  for (const semiId of input.semiFinalistIds) {
    if (input.actualSemiFinalistIds.includes(semiId)) {
      points += 5;
    }
  }

  return points;
}

export interface TopThreeScoreInput {
  firstTeamId: number | null;
  secondTeamId: number | null;
  thirdTeamId: number | null;
  actualFirstId: number | null;
  actualSecondId: number | null;
  actualThirdId: number | null;
}

export function calculateTopThreePoints(input: TopThreeScoreInput): number {
  let points = 0;

  if (
    input.firstTeamId &&
    input.actualFirstId &&
    input.firstTeamId === input.actualFirstId
  ) {
    points += 25;
  }

  if (
    input.secondTeamId &&
    input.actualSecondId &&
    input.secondTeamId === input.actualSecondId
  ) {
    points += 15;
  }

  if (
    input.thirdTeamId &&
    input.actualThirdId &&
    input.thirdTeamId === input.actualThirdId
  ) {
    points += 10;
  }

  return points;
}

export function aggregateLeaderboard(
  members: { user_id: string; display_name: string }[],
  predictions: { user_id: string; points_awarded: number | null }[],
  bracketPoints: Map<string, number>,
  topThreePoints: Map<string, number> = new Map()
) {
  const totals = new Map<
    string,
    { matchPoints: number; exactScores: number; display_name: string }
  >();

  for (const member of members) {
    totals.set(member.user_id, {
      matchPoints: 0,
      exactScores: 0,
      display_name: member.display_name,
    });
  }

  for (const pred of predictions) {
    const entry = totals.get(pred.user_id);
    if (!entry) continue;
    entry.matchPoints += pred.points_awarded ?? 0;
    if (pred.points_awarded === 5 || pred.points_awarded === 10) {
      entry.exactScores += 1;
    }
  }

  const rows = Array.from(totals.entries()).map(([userId, data]) => ({
    user_id: userId,
    display_name: data.display_name,
    match_points: data.matchPoints,
    bracket_points: bracketPoints.get(userId) ?? 0,
    top_three_points: topThreePoints.get(userId) ?? 0,
    total_points:
      data.matchPoints +
      (bracketPoints.get(userId) ?? 0) +
      (topThreePoints.get(userId) ?? 0),
    exact_scores: data.exactScores,
    rank: 0,
  }));

  rows.sort((a, b) => b.total_points - a.total_points);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

export function aggregateMatchdayLeaderboard(
  members: { user_id: string; display_name: string }[],
  predictions: { user_id: string; points_awarded: number | null; match_id: string }[],
  matchIds: string[]
) {
  const matchIdSet = new Set(matchIds);
  const totals = new Map<string, { points: number; display_name: string }>();

  for (const member of members) {
    totals.set(member.user_id, { points: 0, display_name: member.display_name });
  }

  for (const pred of predictions) {
    if (!matchIdSet.has(pred.match_id)) continue;
    const entry = totals.get(pred.user_id);
    if (!entry) continue;
    entry.points += pred.points_awarded ?? 0;
  }

  const rows = Array.from(totals.entries()).map(([userId, data]) => ({
    user_id: userId,
    display_name: data.display_name,
    points: data.points,
    rank: 0,
  }));

  rows.sort((a, b) => b.points - a.points);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

export function mapApiStatus(short: string): MatchStatus {
  const valid: MatchStatus[] = [
    "NS", "TBD", "1H", "HT", "2H", "ET", "P", "FT",
    "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO", "LIVE",
  ];
  return valid.includes(short as MatchStatus) ? (short as MatchStatus) : "NS";
}
