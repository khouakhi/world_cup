import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import {
  aggregateLeaderboard,
  aggregateMatchdayLeaderboard,
} from "@/lib/scoring";
import { LEGACY_DEMO_MATCH_ID } from "@/lib/constants";
import {
  getLeagueMembers,
  getPredictionsForLeague,
  getBracketPredictionsForLeague,
  listMatches,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const leagueId = request.nextUrl.searchParams.get("league_id");
  const matchday = request.nextUrl.searchParams.get("matchday");

  if (!leagueId) {
    return NextResponse.json({ error: "league_id required" }, { status: 400 });
  }

  const members = await getLeagueMembers(leagueId);
  if (!members.length) {
    return NextResponse.json({ leaderboard: [], matchday_leaderboard: [] });
  }

  const predictions = (await getPredictionsForLeague(leagueId)).filter(
    (p) => p.match_id !== LEGACY_DEMO_MATCH_ID
  );
  const brackets = await getBracketPredictionsForLeague(leagueId);

  const bracketMap = new Map<string, number>();
  for (const b of brackets) {
    bracketMap.set(b.user_id, b.points_awarded ?? 0);
  }

  const leaderboard = aggregateLeaderboard(members, predictions, bracketMap);

  let matchdayLeaderboard = null;

  if (matchday) {
    const dayMatches = await listMatches({ matchday });
    const matchIds = dayMatches.map((m) => m.id);
    matchdayLeaderboard = aggregateMatchdayLeaderboard(
      members,
      predictions,
      matchIds
    );
  }

  return NextResponse.json({
    leaderboard,
    matchday_leaderboard: matchdayLeaderboard,
  });
}
