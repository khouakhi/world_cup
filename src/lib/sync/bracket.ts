import { calculateBracketPoints } from "@/lib/scoring";
import {
  getAllBracketPredictions,
  updateBracketPoints,
} from "@/lib/db";

export async function scoreBracketPredictions(
  championTeamId: number,
  runnerUpTeamId: number,
  semiFinalistIds: number[]
): Promise<{ updated: number }> {
  const brackets = await getAllBracketPredictions();
  if (!brackets.length) return { updated: 0 };

  let updated = 0;

  for (const bracket of brackets) {
    const points = calculateBracketPoints({
      championTeamId: bracket.champion_team_id,
      runnerUpTeamId: bracket.runner_up_team_id,
      semiFinalistIds: bracket.semi_finalist_ids ?? [],
      actualChampionId: championTeamId,
      actualRunnerUpId: runnerUpTeamId,
      actualSemiFinalistIds: semiFinalistIds,
    });

    await updateBracketPoints(bracket.id, points);
    updated += 1;
  }

  return { updated };
}
