import type { BadgeType } from "@/types";

interface PredictionForBadges {
  user_id: string;
  points_awarded: number | null;
  match_id: string;
  submitted_at: string;
}

interface MatchForBadges {
  id: string;
  stage: string | null;
  kickoff_at: string;
}

interface CaptainPickForBadges {
  user_id: string;
  match_id: string;
}

export interface EarnedBadge {
  user_id: string;
  badge_type: BadgeType;
  metadata?: Record<string, unknown>;
}

/**
 * Evaluate which badges users have earned based on prediction history.
 */
export function evaluateBadges(
  predictions: PredictionForBadges[],
  matches: MatchForBadges[],
  captainPicks: CaptainPickForBadges[],
  userIds: string[]
): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  for (const userId of userIds) {
    const userPreds = predictions
      .filter((p) => p.user_id === userId)
      .sort(
        (a, b) =>
          new Date(
            matchMap.get(a.match_id)?.kickoff_at ?? a.submitted_at
          ).getTime() -
          new Date(
            matchMap.get(b.match_id)?.kickoff_at ?? b.submitted_at
          ).getTime()
      );

    // Oracle: 3 exact scores in a row
    let exactStreak = 0;
    let maxExactStreak = 0;
    for (const pred of userPreds) {
      const isExact = pred.points_awarded !== null && pred.points_awarded >= 5;
      if (isExact) {
        exactStreak += 1;
        maxExactStreak = Math.max(maxExactStreak, exactStreak);
      } else {
        exactStreak = 0;
      }
    }
    if (maxExactStreak >= 3) {
      earned.push({ user_id: userId, badge_type: "oracle", metadata: { streak: maxExactStreak } });
    }

    // Scoreline Sniper: 5+ exact scores total
    const exactCount = userPreds.filter(
      (p) => p.points_awarded !== null && p.points_awarded >= 5
    ).length;
    if (exactCount >= 5) {
      earned.push({ user_id: userId, badge_type: "exact_score_streak", metadata: { count: exactCount } });
    }

    // Captain Clutch: captain pick with 5+ base points (exact or high score)
    for (const cp of captainPicks.filter((c) => c.user_id === userId)) {
      const pred = userPreds.find((p) => p.match_id === cp.match_id);
      if (pred && pred.points_awarded !== null && pred.points_awarded >= 10) {
        earned.push({ user_id: userId, badge_type: "captain_clutch" });
        break;
      }
    }
  }

  // Group Stage Guru & Knockout King — top scorer per stage
  const groupStagePoints = scoreByStage(predictions, matches, "Group");
  const knockoutPoints = scoreByStage(predictions, matches, "Knockout");

  const groupWinner = topScorer(groupStagePoints);
  if (groupWinner) {
    earned.push({ user_id: groupWinner, badge_type: "group_guru" });
  }

  const knockoutWinner = topScorer(knockoutPoints);
  if (knockoutWinner) {
    earned.push({ user_id: knockoutWinner, badge_type: "knockout_king" });
  }

  // Chaos Agent: most predictions with 0 points but at least 10 predictions
  const zeroPointCounts = new Map<string, number>();
  for (const userId of userIds) {
    const userPreds = predictions.filter((p) => p.user_id === userId);
    if (userPreds.length >= 10) {
      const zeros = userPreds.filter((p) => p.points_awarded === 0).length;
      zeroPointCounts.set(userId, zeros);
    }
  }
  let chaosWinner: string | null = null;
  let maxZeros = 0;
  for (const [userId, zeros] of zeroPointCounts) {
    if (zeros > maxZeros) {
      maxZeros = zeros;
      chaosWinner = userId;
    }
  }
  if (chaosWinner && maxZeros >= 5) {
    earned.push({ user_id: chaosWinner, badge_type: "chaos_agent", metadata: { wrong_count: maxZeros } });
  }

  return earned;
}

function scoreByStage(
  predictions: PredictionForBadges[],
  matches: MatchForBadges[],
  stageKeyword: string
): Map<string, number> {
  const totals = new Map<string, number>();
  const stageMatches = new Set(
    matches
      .filter((m) => m.stage?.toLowerCase().includes(stageKeyword.toLowerCase()))
      .map((m) => m.id)
  );

  for (const pred of predictions) {
    if (!stageMatches.has(pred.match_id)) continue;
    const current = totals.get(pred.user_id) ?? 0;
    totals.set(pred.user_id, current + (pred.points_awarded ?? 0));
  }

  return totals;
}

function topScorer(totals: Map<string, number>): string | null {
  let winner: string | null = null;
  let max = 0;
  for (const [userId, points] of totals) {
    if (points > max) {
      max = points;
      winner = userId;
    }
  }
  return max > 0 ? winner : null;
}
