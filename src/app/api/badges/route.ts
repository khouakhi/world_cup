import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { getBadgesForLeague, getLeagueMembers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const leagueId = request.nextUrl.searchParams.get("league_id");
  if (!leagueId) {
    return NextResponse.json({ error: "league_id required" }, { status: 400 });
  }

  const badges = await getBadgesForLeague(leagueId);
  const members = await getLeagueMembers(leagueId);

  const memberNames = Object.fromEntries(
    members.map((m) => [m.user_id, m.display_name])
  );

  return NextResponse.json({ badges, memberNames });
}
