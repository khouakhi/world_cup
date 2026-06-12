import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { isMatchOpen } from "@/lib/utils";
import {
  isLeagueMember,
  getMatch,
  upsertPrediction,
  getPredictionsForUserInLeague,
} from "@/lib/db";

const schema = z.object({
  league_id: z.string().min(1),
  match_id: z.string().min(1),
  home_score: z.number().int().min(0).max(20),
  away_score: z.number().int().min(0).max(20),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { league_id, match_id, home_score, away_score } = parsed.data;

  if (!(await isLeagueMember(league_id, user.uid))) {
    return NextResponse.json({ error: "Not a league member" }, { status: 403 });
  }

  const match = await getMatch(match_id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (!isMatchOpen(match.kickoff_at, match.is_locked)) {
    return NextResponse.json({ error: "Predictions are locked for this match" }, { status: 403 });
  }

  const prediction = await upsertPrediction(
    league_id,
    user.uid,
    match_id,
    home_score,
    away_score
  );

  return NextResponse.json({ prediction });
}

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const leagueId = request.nextUrl.searchParams.get("league_id");
  if (!leagueId) {
    return NextResponse.json({ error: "league_id required" }, { status: 400 });
  }

  const predictions = await getPredictionsForUserInLeague(leagueId, user.uid);
  return NextResponse.json({ predictions });
}
