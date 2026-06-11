import { getAdminDb, type admin } from "@/lib/firebase/admin";
import type {
  Badge,
  BracketPrediction,
  CaptainPick,
  League,
  Match,
  Prediction,
  Profile,
} from "@/types";
import { generateInviteCode } from "@/lib/utils";
import { LEGACY_DEMO_MATCH_ID } from "@/lib/constants";

const db = () => getAdminDb();

// ─── Profiles ───────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const doc = await db().collection("profiles").doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Profile;
}

export async function upsertProfile(
  userId: string,
  displayName: string
): Promise<Profile> {
  const ref = db().collection("profiles").doc(userId);
  const existing = await ref.get();
  const now = new Date().toISOString();

  const data = {
    display_name: displayName,
    avatar_url: existing.data()?.avatar_url ?? null,
    updated_at: now,
    ...(existing.exists ? {} : { created_at: now }),
  };

  await ref.set(data, { merge: true });
  return { id: userId, ...data, created_at: existing.data()?.created_at ?? now };
}

// ─── Leagues ──────────────────────────────────────────────────────────────────

export async function createLeague(
  name: string,
  createdBy: string
): Promise<League> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    const existing = await db()
      .collection("leagues")
      .where("invite_code", "==", inviteCode)
      .limit(1)
      .get();

    if (!existing.empty) continue;

    const ref = db().collection("leagues").doc();
    const league: League = {
      id: ref.id,
      name,
      invite_code: inviteCode,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };

    await ref.set(league);
    await addLeagueMember(league.id, createdBy);
    return league;
  }

  throw new Error("Could not generate invite code");
}

export async function getLeagueByInviteCode(
  code: string
): Promise<League | null> {
  const snap = await db()
    .collection("leagues")
    .where("invite_code", "==", code.toUpperCase())
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as League;
}

export async function getLeague(leagueId: string): Promise<League | null> {
  const doc = await db().collection("leagues").doc(leagueId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as League;
}

export async function getLeaguesForUser(userId: string): Promise<League[]> {
  const members = await db()
    .collection("leagueMembers")
    .where("user_id", "==", userId)
    .get();

  const leagues: League[] = [];
  for (const memberDoc of members.docs) {
    const leagueId = memberDoc.data().league_id as string;
    const league = await getLeague(leagueId);
    if (league) leagues.push(league);
  }
  return leagues;
}

export async function addLeagueMember(
  leagueId: string,
  userId: string
): Promise<void> {
  const id = `${leagueId}_${userId}`;
  await db()
    .collection("leagueMembers")
    .doc(id)
    .set({
      league_id: leagueId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    });
}

export async function isLeagueMember(
  leagueId: string,
  userId: string
): Promise<boolean> {
  const doc = await db().collection("leagueMembers").doc(`${leagueId}_${userId}`).get();
  return doc.exists;
}

export async function getLeagueMembers(leagueId: string): Promise<
  { user_id: string; display_name: string }[]
> {
  const snap = await db()
    .collection("leagueMembers")
    .where("league_id", "==", leagueId)
    .get();

  const members: { user_id: string; display_name: string }[] = [];
  for (const doc of snap.docs) {
    const userId = doc.data().user_id as string;
    const profile = await getProfile(userId);
    members.push({
      user_id: userId,
      display_name: profile?.display_name ?? "Unknown",
    });
  }
  return members;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export function matchDocId(externalFixtureId: number): string {
  return String(externalFixtureId);
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const doc = await db().collection("matches").doc(matchId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Match;
}

export async function getMatchByExternalId(
  externalFixtureId: number
): Promise<Match | null> {
  return getMatch(matchDocId(externalFixtureId));
}

export async function getMatchByApiFootballId(
  apiFixtureId: number
): Promise<Match | null> {
  const snap = await db()
    .collection("matches")
    .where("api_football_fixture_id", "==", apiFixtureId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Match;
}

export async function getMatchByFootballDataId(
  matchId: number
): Promise<Match | null> {
  const snap = await db()
    .collection("matches")
    .where("football_data_match_id", "==", matchId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Match;
}

export async function findMatchByTeams(
  homeTeamId: number,
  awayTeamId: number
): Promise<Match | null> {
  const snap = await db().collection("matches").get();
  const match = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Match)
    .find(
      (m) => m.home_team_id === homeTeamId && m.away_team_id === awayTeamId
    );
  return match ?? null;
}

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function updateMatchLiveData(
  matchId: string,
  data: Partial<
    Pick<
      Match,
      | "status"
      | "home_score"
      | "away_score"
      | "home_score_halftime"
      | "away_score_halftime"
      | "is_locked"
      | "kickoff_at"
      | "matchday"
      | "round"
      | "stage"
      | "venue"
      | "home_team_id"
      | "home_team_name"
      | "home_team_logo"
      | "away_team_id"
      | "away_team_name"
      | "away_team_logo"
      | "football_data_match_id"
      | "api_football_fixture_id"
    >
  >
): Promise<void> {
  const payload = stripUndefined({
    ...data,
    synced_at: new Date().toISOString(),
  });
  await db().collection("matches").doc(matchId).set(payload, { merge: true });
}

export async function upsertMatch(
  externalFixtureId: number,
  data: Omit<Match, "id">
): Promise<Match> {
  const id = matchDocId(externalFixtureId);
  const match = { id, ...data };
  await db().collection("matches").doc(id).set(
    { ...match, synced_at: new Date().toISOString() },
    { merge: true }
  );
  return match;
}

export async function listMatches(filters?: {
  matchday?: string;
  status?: string[];
}): Promise<Match[]> {
  let query: admin.firestore.Query = db().collection("matches");

  if (filters?.matchday) {
    query = query.where("matchday", "==", filters.matchday);
  }

  const snap = await query.get();
  let matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);

  if (filters?.status?.length) {
    matches = matches.filter((m) => filters.status!.includes(m.status));
  }

  matches.sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );

  // Exclude legacy demo fixtures if any remain in the database
  return matches.filter((m) => m.id !== LEGACY_DEMO_MATCH_ID);
}

export async function listMatchdays(): Promise<string[]> {
  const snap = await db().collection("matches").select("matchday").get();
  const days = [...new Set(snap.docs.map((d) => d.data().matchday as string))];
  days.sort();
  return days;
}

export async function listSemiFinalMatches(): Promise<Match[]> {
  const snap = await db().collection("matches").get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Match)
    .filter(
      (m) =>
        m.round?.toLowerCase().includes("semi-final") &&
        ["FT", "AET", "PEN"].includes(m.status)
    );
}

// ─── Predictions ──────────────────────────────────────────────────────────────

function predictionDocId(
  leagueId: string,
  userId: string,
  matchId: string
): string {
  return `${leagueId}_${userId}_${matchId}`;
}

export async function upsertPrediction(
  leagueId: string,
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<Prediction> {
  const id = predictionDocId(leagueId, userId, matchId);
  const prediction: Prediction = {
    id,
    league_id: leagueId,
    user_id: userId,
    match_id: matchId,
    home_score: homeScore,
    away_score: awayScore,
    points_awarded: null,
    submitted_at: new Date().toISOString(),
  };
  await db().collection("predictions").doc(id).set(prediction, { merge: true });
  return prediction;
}

export async function getPredictionsForLeague(
  leagueId: string
): Promise<Prediction[]> {
  const snap = await db()
    .collection("predictions")
    .where("league_id", "==", leagueId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Prediction);
}

export async function getPredictionsForMatch(
  matchId: string
): Promise<Prediction[]> {
  const snap = await db()
    .collection("predictions")
    .where("match_id", "==", matchId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Prediction);
}

export async function updatePredictionPoints(
  predictionId: string,
  points: number
): Promise<void> {
  await db().collection("predictions").doc(predictionId).update({
    points_awarded: points,
  });
}

export async function deletePredictionsForMatch(matchId: string): Promise<void> {
  const snap = await db()
    .collection("predictions")
    .where("match_id", "==", matchId)
    .get();
  const batch = db().batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
  }
  if (!snap.empty) {
    await batch.commit();
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  await db().collection("matches").doc(matchId).delete();
}

// ─── Captain picks ────────────────────────────────────────────────────────────

export async function upsertCaptainPick(
  leagueId: string,
  userId: string,
  matchday: string,
  matchId: string
): Promise<CaptainPick> {
  const id = `${leagueId}_${userId}_${matchday}`;
  const pick: CaptainPick = {
    league_id: leagueId,
    user_id: userId,
    matchday,
    match_id: matchId,
  };
  await db().collection("captainPicks").doc(id).set(pick);
  return pick;
}

export async function getCaptainPick(
  leagueId: string,
  userId: string,
  matchday: string
): Promise<CaptainPick | null> {
  const doc = await db()
    .collection("captainPicks")
    .doc(`${leagueId}_${userId}_${matchday}`)
    .get();
  if (!doc.exists) return null;
  return doc.data() as CaptainPick;
}

export async function getCaptainPicksForLeague(
  leagueId: string
): Promise<CaptainPick[]> {
  const snap = await db()
    .collection("captainPicks")
    .where("league_id", "==", leagueId)
    .get();
  return snap.docs.map((d) => d.data() as CaptainPick);
}

export async function deleteCaptainPicksForMatch(matchId: string): Promise<void> {
  const snap = await db()
    .collection("captainPicks")
    .where("match_id", "==", matchId)
    .get();
  const batch = db().batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
  }
  if (!snap.empty) {
    await batch.commit();
  }
}

// ─── Bracket ──────────────────────────────────────────────────────────────────

export async function upsertBracketPrediction(
  leagueId: string,
  userId: string,
  data: Partial<BracketPrediction>
): Promise<BracketPrediction> {
  const id = `${leagueId}_${userId}`;
  const ref = db().collection("bracketPredictions").doc(id);
  const existing = await ref.get();

  const bracket: BracketPrediction = {
    id,
    league_id: leagueId,
    user_id: userId,
    champion_team_id: data.champion_team_id ?? null,
    champion_team_name: data.champion_team_name ?? null,
    runner_up_team_id: data.runner_up_team_id ?? null,
    runner_up_team_name: data.runner_up_team_name ?? null,
    semi_finalist_ids: data.semi_finalist_ids ?? [],
    semi_finalist_names: data.semi_finalist_names ?? [],
    points_awarded: existing.data()?.points_awarded ?? 0,
    is_locked: existing.data()?.is_locked ?? false,
    submitted_at: new Date().toISOString(),
  };

  await ref.set(bracket, { merge: true });
  return bracket;
}

export async function getBracketPrediction(
  leagueId: string,
  userId: string
): Promise<BracketPrediction | null> {
  const doc = await db()
    .collection("bracketPredictions")
    .doc(`${leagueId}_${userId}`)
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as BracketPrediction;
}

export async function getBracketPredictionsForLeague(
  leagueId: string
): Promise<BracketPrediction[]> {
  const snap = await db()
    .collection("bracketPredictions")
    .where("league_id", "==", leagueId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BracketPrediction);
}

export async function getAllBracketPredictions(): Promise<BracketPrediction[]> {
  const snap = await db().collection("bracketPredictions").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BracketPrediction);
}

export async function updateBracketPoints(
  bracketId: string,
  points: number
): Promise<void> {
  await db().collection("bracketPredictions").doc(bracketId).update({
    points_awarded: points,
    is_locked: true,
  });
}

export async function countStartedMatches(): Promise<number> {
  const snap = await db().collection("matches").get();
  return snap.docs.filter((d) => {
    const status = d.data().status as string;
    return status !== "NS" && status !== "TBD";
  }).length;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function upsertBadge(
  leagueId: string,
  userId: string,
  badgeType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const id = `${leagueId}_${userId}_${badgeType}`;
  await db()
    .collection("badges")
    .doc(id)
    .set({
      league_id: leagueId,
      user_id: userId,
      badge_type: badgeType,
      metadata,
      earned_at: new Date().toISOString(),
    });
}

export async function getBadgesForLeague(leagueId: string): Promise<Badge[]> {
  const snap = await db()
    .collection("badges")
    .where("league_id", "==", leagueId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Badge);
}

export async function deleteBadge(badgeId: string): Promise<void> {
  await db().collection("badges").doc(badgeId).delete();
}

// ─── Match previews ───────────────────────────────────────────────────────────

export async function getMatchPreview(matchId: string): Promise<{
  preview_text: string;
  fun_fact: string | null;
} | null> {
  const doc = await db().collection("matchPreviews").doc(matchId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    preview_text: data.preview_text as string,
    fun_fact: (data.fun_fact as string | null) ?? null,
  };
}

export async function getMatchPreviews(
  matchIds: string[]
): Promise<Record<string, { preview_text: string; fun_fact: string | null }>> {
  const previews: Record<string, { preview_text: string; fun_fact: string | null }> = {};
  await Promise.all(
    matchIds.map(async (id) => {
      const preview = await getMatchPreview(id);
      if (preview) previews[id] = preview;
    })
  );
  return previews;
}

export async function saveMatchPreview(
  matchId: string,
  previewText: string,
  funFact: string
): Promise<void> {
  await db().collection("matchPreviews").doc(matchId).set({
    match_id: matchId,
    preview_text: previewText,
    fun_fact: funFact,
    generated_at: new Date().toISOString(),
  });
}

export async function listUpcomingMatchesWithinHours(
  hours: number
): Promise<Match[]> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const snap = await db()
    .collection("matches")
    .where("status", "==", "NS")
    .get();

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Match)
    .filter((m) => {
      const kickoff = new Date(m.kickoff_at);
      return kickoff >= now && kickoff <= windowEnd;
    });
}

export async function previewExists(matchId: string): Promise<boolean> {
  const doc = await db().collection("matchPreviews").doc(matchId).get();
  return doc.exists;
}

export async function listAllMatches(): Promise<Match[]> {
  const snap = await db().collection("matches").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);
}
