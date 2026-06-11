import { upsertMatch, listAllMatches } from "@/lib/db";
import { normaliseAllWc26Matches } from "@/lib/worldcup2026/normalise";

export async function seedWorldCup2026Fixtures(options?: {
  force?: boolean;
}): Promise<{ seeded: number; skipped: number }> {
  const existing = await listAllMatches();
  const wc26Matches = existing.filter((m) => m.external_fixture_id <= 104);

  if (wc26Matches.length >= 104 && !options?.force) {
    return { seeded: 0, skipped: 104 };
  }

  const fixtures = normaliseAllWc26Matches();
  let seeded = 0;

  for (const fixture of fixtures) {
    await upsertMatch(fixture.external_fixture_id, fixture);
    seeded += 1;
  }

  return { seeded, skipped: 0 };
}

export async function ensureWorldCup2026Seeded(): Promise<void> {
  const existing = await listAllMatches();
  const hasWc26 = existing.some(
    (m) => m.external_fixture_id >= 1 && m.external_fixture_id <= 104
  );
  if (!hasWc26) {
    await seedWorldCup2026Fixtures();
  }
}
