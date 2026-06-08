import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import {
  isLeagueMember,
  upsertTopThreePrediction,
  getTopThreePrediction,
  countStartedMatches,
} from "@/lib/db";

const schema = z.object({
  league_id: z.string().min(1),
  first_team_id: z.number().int().optional(),
  first_team_name: z.string().optional(),
  second_team_id: z.number().int().optional(),
  second_team_name: z.string().optional(),
  third_team_id: z.number().int().optional(),
  third_team_name: z.string().optional(),
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

  const { league_id, ...data } = parsed.data;

  if (!(await isLeagueMember(league_id, user.uid))) {
    return NextResponse.json({ error: "Not a league member" }, { status: 403 });
  }

  const startedCount = await countStartedMatches();
  if (startedCount > 0) {
    const existing = await getTopThreePrediction(league_id, user.uid);
    if (existing?.is_locked) {
      return NextResponse.json({ error: "Top 3 predictions are locked" }, { status: 403 });
    }
  }

  const ids = [data.first_team_id, data.second_team_id, data.third_team_id].filter(
    (id): id is number => id !== undefined && id !== null
  );
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "Each team must be different (1st, 2nd, 3rd)" },
      { status: 400 }
    );
  }

  const prediction = await upsertTopThreePrediction(league_id, user.uid, data);
  return NextResponse.json({ top_three: prediction });
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

  const topThree = await getTopThreePrediction(leagueId, user.uid);
  return NextResponse.json({ top_three: topThree });
}
