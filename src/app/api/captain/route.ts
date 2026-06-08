import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { isMatchOpen } from "@/lib/utils";
import {
  isLeagueMember,
  getMatch,
  upsertCaptainPick,
  getCaptainPick,
} from "@/lib/db";

const schema = z.object({
  league_id: z.string().min(1),
  matchday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  match_id: z.string().min(1),
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

  const { league_id, matchday, match_id } = parsed.data;

  if (!(await isLeagueMember(league_id, user.uid))) {
    return NextResponse.json({ error: "Not a league member" }, { status: 403 });
  }

  const match = await getMatch(match_id);
  if (!match || match.matchday !== matchday) {
    return NextResponse.json({ error: "Invalid match for this matchday" }, { status: 400 });
  }

  if (!isMatchOpen(match.kickoff_at, match.is_locked)) {
    return NextResponse.json({ error: "Match is locked" }, { status: 403 });
  }

  const captainPick = await upsertCaptainPick(
    league_id,
    user.uid,
    matchday,
    match_id
  );

  return NextResponse.json({ captain_pick: captainPick });
}

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const leagueId = request.nextUrl.searchParams.get("league_id");
  const matchday = request.nextUrl.searchParams.get("matchday");

  if (!leagueId || !matchday) {
    return NextResponse.json({ error: "league_id and matchday required" }, { status: 400 });
  }

  const captainPick = await getCaptainPick(leagueId, user.uid, matchday);
  return NextResponse.json({ captain_pick: captainPick });
}
