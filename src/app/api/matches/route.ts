import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import { getWc26Teams } from "@/lib/worldcup2026/normalise";
import { ensureWorldCup2026Seeded } from "@/lib/worldcup2026/seed";
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

  await ensureWorldCup2026Seeded();

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
    const teams = getWc26Teams().map((t) => ({
      id: t.id,
      name: t.name,
      logo: t.logo,
    }));
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Failed to load World Cup 2026 teams:", error);
    return NextResponse.json(
      { error: "Could not load teams. Please try again later." },
      { status: 500 }
    );
  }
}
