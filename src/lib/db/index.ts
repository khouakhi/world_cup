import { getAdminDb, type admin } from "@/lib/firebase/admin";
import type {
  Badge,
  BracketPrediction,
  CaptainPick,
  League,
  Match,
  Prediction,
  Profile,
  TopThreePrediction,
} from "@/types";
import { generateInviteCode } from "@/lib/utils";

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
  return matches;
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

// ─── Top 3 podium predictions ─────────────────────────────────────────────────

export async function upsertTopThreePrediction(
  leagueId: string,
  userId: string,
  data: Partial<TopThreePrediction>
): Promise<TopThreePrediction> {
  const id = `${leagueId}_${userId}`;
  const ref = db().collection("topThreePredictions").doc(id);
  const existing = await ref.get();

  const prediction: TopThreePrediction = {
    id,
    league_id: leagueId,
    user_id: userId,
    first_team_id: data.first_team_id ?? null,
    first_team_name: data.first_team_name ?? null,
    second_team_id: data.second_team_id ?? null,
    second_team_name: data.second_team_name ?? null,
    third_team_id: data.third_team_id ?? null,
    third_team_name: data.third_team_name ?? null,
    points_awarded: existing.data()?.points_awarded ?? 0,
    is_locked: existing.data()?.is_locked ?? false,
    submitted_at: new Date().toISOString(),
  };

  await ref.set(prediction, { merge: true });
  return prediction;
}

export async function getTopThreePrediction(
  leagueId: string,
  userId: string
): Promise<TopThreePrediction | null> {
  const doc = await db()
    .collection("topThreePredictions")
    .doc(`${leagueId}_${userId}`)
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as TopThreePrediction;
}

export async function getTopThreePredictionsForLeague(
  leagueId: string
): Promise<TopThreePrediction[]> {
  const snap = await db()
    .collection("topThreePredictions")
    .where("league_id", "==", leagueId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TopThreePrediction);
}

export async function getAllTopThreePredictions(): Promise<TopThreePrediction[]> {
  const snap = await db().collection("topThreePredictions").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TopThreePrediction);
}

export async function updateTopThreePoints(
  predictionId: string,
  points: number,
  lock = false
): Promise<void> {
  const update: Record<string, unknown> = { points_awarded: points };
  if (lock) update.is_locked = true;
  await db().collection("topThreePredictions").doc(predictionId).update(update);
}

export async function getTournamentPodiumTeams(): Promise<{
  firstId: number | null;
  secondId: number | null;
  thirdId: number | null;
}> {
  const matches = await listAllMatches();
  const finished = ["FT", "AET", "PEN"];

  let firstId: number | null = null;
  let secondId: number | null = null;
  let thirdId: number | null = null;

  for (const m of matches) {
    if (!finished.includes(m.status) || m.home_score === null || m.away_score === null) {
      continue;
    }
    const round = (m.round ?? "").toLowerCase();
    const winner =
      m.home_score > m.away_score ? m.home_team_id : m.away_team_id;
    const loser =
      m.home_score > m.away_score ? m.away_team_id : m.home_team_id;

    if (round.includes("final") && !round.includes("semi") && !round.includes("3rd")) {
      firstId = winner;
      secondId = loser;
    }

    if (round.includes("3rd") || round.includes("third")) {
      thirdId = winner;
    }
  }

  return { firstId, secondId, thirdId };
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
