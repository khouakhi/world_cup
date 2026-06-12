import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import {
  isLeagueMember,
  upsertBracketPrediction,
  getBracketPrediction,
} from "@/lib/db";
import {
  getBracketDeadlineLabel,
  isBracketSubmissionOpen,
} from "@/lib/bracket-deadline";

const schema = z.object({
  league_id: z.string().min(1),
  champion_team_id: z.number().int().optional(),
  champion_team_name: z.string().optional(),
  runner_up_team_id: z.number().int().optional(),
  runner_up_team_name: z.string().optional(),
  semi_finalist_ids: z.array(z.number().int()).max(4).optional(),
  semi_finalist_names: z.array(z.string()).max(4).optional(),
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

  const { league_id, ...bracketData } = parsed.data;

  if (!(await isLeagueMember(league_id, user.uid))) {
    return NextResponse.json({ error: "Not a league member" }, { status: 403 });
  }

  if (!isBracketSubmissionOpen()) {
    return NextResponse.json(
      {
        error: `The bracket deadline has passed (${getBracketDeadlineLabel()})`,
      },
      { status: 403 }
    );
  }

  const existing = await getBracketPrediction(league_id, user.uid);
  if (existing?.is_locked) {
    return NextResponse.json(
      { error: "Your bracket is locked and cannot be changed" },
      { status: 403 }
    );
  }

  const bracket = await upsertBracketPrediction(league_id, user.uid, bracketData);
  return NextResponse.json({
    bracket,
    submission_open: isBracketSubmissionOpen(),
    deadline_label: getBracketDeadlineLabel(),
  });
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

  const bracket = await getBracketPrediction(leagueId, user.uid);
  return NextResponse.json({
    bracket,
    submission_open: isBracketSubmissionOpen(),
    deadline_label: getBracketDeadlineLabel(),
  });
}
