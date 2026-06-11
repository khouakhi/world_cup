import {
  API_FOOTBALL_LEAGUE_ID,
  getApiFootballSeason,
} from "@/lib/api-football/config";
import type { MatchStatus } from "@/types";
import { mapApiStatus } from "@/lib/scoring";

const BASE_URL = "https://v3.football.api-sports.io";

interface ApiFootballTeam {
  id: number;
  name: string;
  logo: string;
}

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue: { name: string | null; city: string | null } | null;
  };
  league: {
    round: string;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
  };
}

export interface NormalisedFixture {
  external_fixture_id: number;
  matchday: string;
  round: string | null;
  stage: string | null;
  home_team_id: number;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_id: number;
  away_team_name: string;
  away_team_logo: string | null;
  venue: string | null;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_score_halftime: number | null;
  away_score_halftime: number | null;
  is_locked: boolean;
}

function getHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }
  return { "x-apisports-key": key };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API-Football error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    const errStr = JSON.stringify(json.errors);
    if (errStr.toLowerCase().includes("free plans do not have access to this season")) {
      throw new Error(
        "API-Football free plan does not include season 2026. Add API_FOOTBALL_SEASON=2022 to .env.local (free tier allows 2022–2024). Use 2026 when you upgrade for the real tournament."
      );
    }
    throw new Error(`API-Football errors: ${errStr}`);
  }

  return json.response as T;
}

function inferStage(round: string | null): string | null {
  if (!round) return null;
  const lower = round.toLowerCase();
  if (lower.includes("group")) return "Group Stage";
  if (lower.includes("round of 32") || lower.includes("round of 16")) {
    return "Knockout Stage";
  }
  if (
    lower.includes("quarter") ||
    lower.includes("semi") ||
    lower.includes("final")
  ) {
    return "Knockout Stage";
  }
  return round;
}

function normaliseFixture(raw: ApiFootballFixture): NormalisedFixture {
  const kickoff = raw.fixture.date;
  const lockTime = new Date(kickoff).getTime() - 15 * 60 * 1000;
  const status = mapApiStatus(raw.fixture.status.short);

  return {
    external_fixture_id: raw.fixture.id,
    matchday: kickoff.split("T")[0],
    round: raw.league.round ?? null,
    stage: inferStage(raw.league.round ?? null),
    home_team_id: raw.teams.home.id,
    home_team_name: raw.teams.home.name,
    home_team_logo: raw.teams.home.logo ?? null,
    away_team_id: raw.teams.away.id,
    away_team_name: raw.teams.away.name,
    away_team_logo: raw.teams.away.logo ?? null,
    venue: raw.fixture.venue?.name ?? null,
    kickoff_at: kickoff,
    status,
    home_score: raw.goals.home,
    away_score: raw.goals.away,
    home_score_halftime: raw.score.halftime.home,
    away_score_halftime: raw.score.halftime.away,
    is_locked: Date.now() >= lockTime || !["NS", "TBD"].includes(status),
  };
}

export async function fetchWorldCupFixtures(): Promise<NormalisedFixture[]> {
  const season = getApiFootballSeason();
  const fixtures = await apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${API_FOOTBALL_LEAGUE_ID}&season=${season}`
  );
  return fixtures.map(normaliseFixture);
}

export async function fetchLiveWorldCupFixtures(): Promise<NormalisedFixture[]> {
  const season = getApiFootballSeason();
  const fixtures = await apiFetch<ApiFootballFixture[]>(
    `/fixtures?live=all&league=${API_FOOTBALL_LEAGUE_ID}&season=${season}`
  );
  return fixtures.map(normaliseFixture);
}

export async function fetchFixtureById(
  fixtureId: number
): Promise<NormalisedFixture | null> {
  const fixtures = await apiFetch<ApiFootballFixture[]>(
    `/fixtures?id=${fixtureId}`
  );
  if (!fixtures.length) return null;
  return normaliseFixture(fixtures[0]);
}

export interface TeamStanding {
  rank: number;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  group: string;
}

export async function fetchWorldCupStandings(): Promise<TeamStanding[]> {
  const season = getApiFootballSeason();
  const data = await apiFetch<
    {
      group: string;
      league: { standings: Array<Array<{
        rank: number;
        team: ApiFootballTeam;
        all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
        points: number;
      }>> };
    }[]
  >(`/standings?league=${API_FOOTBALL_LEAGUE_ID}&season=${season}`);

  const standings: TeamStanding[] = [];

  for (const group of data) {
    const flat = group.league.standings.flat();
    for (const row of flat) {
      standings.push({
        rank: row.rank,
        team_id: row.team.id,
        team_name: row.team.name,
        team_logo: row.team.logo ?? null,
        played: row.all.played,
        won: row.all.win,
        draw: row.all.draw,
        lost: row.all.lose,
        goals_for: row.all.goals.for,
        goals_against: row.all.goals.against,
        points: row.points,
        group: group.group,
      });
    }
  }

  return standings;
}

export interface HeadToHeadSummary {
  played: number;
  home_wins: number;
  away_wins: number;
  draws: number;
  recent_results: string[];
}

export async function fetchHeadToHead(
  team1Id: number,
  team2Id: number
): Promise<HeadToHeadSummary> {
  const fixtures = await apiFetch<ApiFootballFixture[]>(
    `/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=5`
  );

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  const recent: string[] = [];

  for (const f of fixtures) {
    if (f.goals.home === null || f.goals.away === null) continue;
    const score = `${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name}`;
    recent.push(score);
    if (f.goals.home > f.goals.away) homeWins += 1;
    else if (f.goals.home < f.goals.away) awayWins += 1;
    else draws += 1;
  }

  return {
    played: fixtures.length,
    home_wins: homeWins,
    away_wins: awayWins,
    draws,
    recent_results: recent,
  };
}

export async function fetchWorldCupTeams(): Promise<
  { id: number; name: string; logo: string | null }[]
> {
  const season = getApiFootballSeason();
  const teams = await apiFetch<{ team: ApiFootballTeam }[]>(
    `/teams?league=${API_FOOTBALL_LEAGUE_ID}&season=${season}`
  );
  return teams.map((t) => ({
    id: t.team.id,
    name: t.team.name,
    logo: t.team.logo ?? null,
  }));
}
