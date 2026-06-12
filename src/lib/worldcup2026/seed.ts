import { upsertMatch } from "@/lib/db";
import { normaliseAllWc26Matches } from "@/lib/worldcup2026/normalise";
import { getFootballDataApiToken } from "@/lib/football-data/config";
import {
  getWorldCupMetadata,
  isWorldCupSeeded,
  saveWorldCupMetadata,
} from "@/lib/worldcup2026/metadata";

export async function seedWorldCup2026Fixtures(options?: {
  force?: boolean;
}): Promise<{ seeded: number; skipped: number }> {
  const meta = await getWorldCupMetadata();
  if (meta?.seeded && meta.fixture_count >= 104 && !options?.force) {
    return { seeded: 0, skipped: 104 };
  }

  const fixtures = normaliseAllWc26Matches();
  let seeded = 0;

  for (const fixture of fixtures) {
    await upsertMatch(fixture.external_fixture_id, fixture);
    seeded += 1;
  }

  const matchdays = [...new Set(fixtures.map((f) => f.matchday))].sort();

  await saveWorldCupMetadata({
    seeded: true,
    fixture_count: fixtures.length,
    matchdays,
  });

  if (getFootballDataApiToken()) {
    const { syncFixtures } = await import("@/lib/sync/fixtures");
    await syncFixtures();
  }

  return { seeded, skipped: 0 };
}

export async function ensureWorldCup2026Seeded(): Promise<void> {
  if (await isWorldCupSeeded()) return;
  await seedWorldCup2026Fixtures();
}
