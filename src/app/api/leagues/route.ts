import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { generateInviteCode } from "@/lib/utils";
import {
  createLeague,
  getLeagueByInviteCode,
  addLeagueMember,
  getLeaguesForUser,
  isLeagueMember,
} from "@/lib/db";
import { isLeagueAdmin } from "@/lib/constants";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(60),
});

const joinSchema = z.object({
  invite_code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "create") {
    if (!isLeagueAdmin(user.email)) {
      return NextResponse.json(
        { error: "Only the league organiser can create leagues" },
        { status: 403 }
      );
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    try {
      const league = await createLeague(parsed.data.name, user.uid);
      return NextResponse.json({ league });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to create league" },
        { status: 500 }
      );
    }
  }

  if (action === "join") {
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const league = await getLeagueByInviteCode(parsed.data.invite_code);
    if (!league) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const alreadyMember = await isLeagueMember(league.id, user.uid);
    if (!alreadyMember) {
      await addLeagueMember(league.id, user.uid);
    }
    return NextResponse.json({ league });
  }

  if (action === "auto_join_main") {
    const { getMainLeagueInviteCode } = await import("@/lib/constants");
    const league = await getLeagueByInviteCode(getMainLeagueInviteCode());
    if (!league) {
      return NextResponse.json(
        { error: "Main league not found. Ask the organiser for help." },
        { status: 404 }
      );
    }

    const alreadyMember = await isLeagueMember(league.id, user.uid);
    if (!alreadyMember) {
      await addLeagueMember(league.id, user.uid);
    }
    return NextResponse.json({ league });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const leagues = await getLeaguesForUser(user.uid);
  return NextResponse.json({ leagues });
}
