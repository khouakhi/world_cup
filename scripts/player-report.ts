/**
 * Print a player's predictions, results, and banker picks for a league.
 *
 * Usage:
 *   npx tsx scripts/player-report.ts Henners
 *   npx tsx scripts/player-report.ts Henners aN0f0kDZCMdZ5R0pxYZq
 */
import {
  getCaptainPicksForLeague,
  getLeagueMembers,
  getMatch,
  getPredictionsForUserInLeague,
} from "../src/lib/db";
import { formatKickoff, isFinishedStatus } from "../src/lib/utils";

const DEFAULT_LEAGUE_ID = "aN0f0kDZCMdZ5R0pxYZq";

async function main() {
  const nameQuery = process.argv[2];
  const leagueId = process.argv[3] ?? DEFAULT_LEAGUE_ID;

  if (!nameQuery) {
    console.error("Usage: npx tsx scripts/player-report.ts <display-name>");
    process.exit(1);
  }

  const members = await getLeagueMembers(leagueId);
  const member = members.find((m) =>
    m.display_name.toLowerCase().includes(nameQuery.toLowerCase())
  );

  if (!member) {
    console.error(`No player matching "${nameQuery}" in league ${leagueId}`);
    process.exit(1);
  }

  const [predictions, captainPicks] = await Promise.all([
    getPredictionsForUserInLeague(leagueId, member.user_id),
    getCaptainPicksForLeague(leagueId),
  ]);

  const bankerMatchIds = new Set(
    captainPicks
      .filter((pick) => pick.user_id === member.user_id)
      .map((pick) => pick.match_id)
  );

  const rows = await Promise.all(
    predictions.map(async (pred) => {
      const match = await getMatch(pred.match_id);
      if (!match) return null;

      const hasResult =
        isFinishedStatus(match.status) &&
        match.home_score !== null &&
        match.away_score !== null;

      return {
        kickoff: match.kickoff_at,
        fixture: `${match.home_team_name} vs ${match.away_team_name}`,
        pick: `${pred.home_score}–${pred.away_score}`,
        result: hasResult
          ? `${match.home_score}–${match.away_score}`
          : match.status === "NS"
            ? "Not played"
            : "Pending",
        pts: pred.points_awarded ?? (hasResult ? 0 : "–"),
        banker: bankerMatchIds.has(pred.match_id) ? "Yes" : "",
      };
    })
  );

  const sorted = rows
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  console.log(
    JSON.stringify(
      {
        player: member.display_name,
        league_id: leagueId,
        predictions: sorted.map((row) => ({
          ...row,
          kickoff: formatKickoff(row.kickoff),
        })),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
