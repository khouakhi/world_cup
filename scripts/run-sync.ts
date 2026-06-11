import { seedWorldCup2026Fixtures } from "../src/lib/worldcup2026/seed";
import { syncFixtures } from "../src/lib/sync/fixtures";
import { listAllMatches } from "../src/lib/db";

async function main() {
  const seed = await seedWorldCup2026Fixtures({ force: true });
  const sync = await syncFixtures();
  console.log(JSON.stringify({ seed, sync }, null, 2));

  const mexico = (await listAllMatches()).find(
    (m) => m.home_team_name === "Mexico" && m.away_team_name === "South Africa"
  );
  console.log(
    "Mexico v RSA kickoff:",
    mexico?.kickoff_at,
    "football_data_match_id:",
    mexico?.football_data_match_id
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
