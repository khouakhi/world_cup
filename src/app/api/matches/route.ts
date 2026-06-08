import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { fetchWorldCupTeams } from "@/lib/api-football/client";
import {
  listMatches,
  listMatchdays,
  getMatchPreviews,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const matchday = request.nextUrl.searchParams.get("matchday");
  const status = request.nextUrl.searchParams.get("status");

  let statusFilter: string[] | undefined;
  if (status === "upcoming") {
    statusFilter = ["NS", "TBD"];
  } else if (status === "live") {
    statusFilter = ["1H", "HT", "2H", "ET", "P", "LIVE"];
  } else if (status === "finished") {
    statusFilter = ["FT", "AET", "PEN"];
  }

  const matches = await listMatches({
    matchday: matchday ?? undefined,
    status: statusFilter,
  });

  const matchIds = matches.map((m) => m.id);
  const previews = await getMatchPreviews(matchIds);
  const matchdays = await listMatchdays();

  return NextResponse.json({
    matches: matches.map((m) => ({
      ...m,
      preview: previews[m.id] ?? null,
    })),
    matchdays,
  });
}

export async function POST() {
  try {
    const teams = await fetchWorldCupTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
