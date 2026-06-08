import { calculateTopThreePoints } from "@/lib/scoring";
import {
  getAllTopThreePredictions,
  getTournamentPodiumTeams,
  updateTopThreePoints,
} from "@/lib/db";

export async function scoreTopThreePredictions(): Promise<{ updated: number }> {
  const podium = await getTournamentPodiumTeams();

  if (!podium.firstId && !podium.secondId && !podium.thirdId) {
    return { updated: 0 };
  }

  const predictions = await getAllTopThreePredictions();
  if (!predictions.length) return { updated: 0 };

  const lock = !!(podium.firstId && podium.secondId && podium.thirdId);
  let updated = 0;

  for (const pred of predictions) {
    const points = calculateTopThreePoints({
      firstTeamId: pred.first_team_id,
      secondTeamId: pred.second_team_id,
      thirdTeamId: pred.third_team_id,
      actualFirstId: podium.firstId,
      actualSecondId: podium.secondId,
      actualThirdId: podium.thirdId,
    });

    await updateTopThreePoints(pred.id, points, lock);
    updated += 1;
  }

  return { updated };
}
