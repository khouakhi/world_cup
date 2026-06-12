import { getAdminDb } from "@/lib/firebase/admin";

const db = () => getAdminDb();
const DOC_PATH = "worldcup2026";

export type WorldCupMetadata = {
  seeded: boolean;
  fixture_count: number;
  matchdays: string[];
  updated_at: string;
};

export async function getWorldCupMetadata(): Promise<WorldCupMetadata | null> {
  const doc = await db().collection("system").doc(DOC_PATH).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    seeded: Boolean(data.seeded),
    fixture_count: Number(data.fixture_count ?? 0),
    matchdays: Array.isArray(data.matchdays) ? (data.matchdays as string[]) : [],
    updated_at: String(data.updated_at ?? ""),
  };
}

export async function isWorldCupSeeded(): Promise<boolean> {
  const meta = await getWorldCupMetadata();
  if (meta?.seeded && meta.fixture_count >= 104) return true;

  const snap = await db()
    .collection("matches")
    .where("external_fixture_id", "==", 1)
    .limit(1)
    .get();

  return !snap.empty;
}

export async function saveWorldCupMetadata(
  partial: Partial<WorldCupMetadata>
): Promise<void> {
  await db()
    .collection("system")
    .doc(DOC_PATH)
    .set(
      {
        ...partial,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
}

export function pickDefaultMatchday(matchdays: string[]): string | undefined {
  if (!matchdays.length) return undefined;
  const today = new Date().toISOString().split("T")[0];
  return matchdays.find((day) => day >= today) ?? matchdays[0];
}
