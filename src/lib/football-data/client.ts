import {
  FOOTBALL_DATA_WC_CODE,
  FOOTBALL_DATA_WC_SEASON,
  getFootballDataApiToken,
} from "@/lib/football-data/config";
import { matchdayFromKickoff } from "@/lib/utils";
import { PREDICTION_LOCK_MINUTES } from "@/types";
import type { MatchStatus } from "@/types";

const BASE_URL = "https://api.football-data.org/v4";

interface FootballDataTeam {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  venue: string | null;
  stage: string;
  group: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

interface FootballDataMatchList {
  matches: FootballDataMatch[];
}

export interface NormalisedFootballDataMatch {
  football_data_match_id: number;
  matchday: string;
  round: string | null;
  stage: string | null;
  home_team_name: string;
  home_team_tla: string | null;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_tla: string | null;
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
  const token = getFootballDataApiToken();
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not configured");
  }
  return { "X-Auth-Token": token };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function mapFootballDataStatus(status: string): MatchStatus {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "NS";
    case "IN_PLAY":
      return "1H";
    case "PAUSED":
      return "HT";
    case "LIVE":
      return "LIVE";
    case "FINISHED":
      return "FT";
    case "POSTPONED":
      return "PST";
    case "SUSPENDED":
    case "CANCELLED":
      return "CANC";
    default:
      return "NS";
  }
}

function formatGroupLabel(group: string | null): string | null {
  if (!group) return null;
  const letter = group.match(/^GROUP_([A-Z])$/)?.[1];
  return letter ?? group.replace(/^GROUP_/, "");
}

function inferRound(stage: string, group: string | null): string {
  switch (stage) {
    case "GROUP_STAGE": {
      const label = formatGroupLabel(group);
      return label ? `Group Stage - Group ${label}` : "Group Stage";
    }
    case "LAST_32":
      return "Round of 32";
    case "LAST_16":
      return "Round of 16";
    case "QUARTER_FINALS":
      return "Quarter-finals";
    case "SEMI_FINALS":
      return "Semi-finals";
    case "THIRD_PLACE":
      return "3rd Place Final";
    case "FINAL":
      return "Final";
    default:
      return stage.replace(/_/g, " ");
  }
}

function inferStage(stage: string): string {
  return stage === "GROUP_STAGE" ? "Group Stage" : "Knockout Stage";
}

/** @deprecated Use matchdayFromKickoff from @/lib/utils */
export function matchdayFromUtc(iso: string): string {
  return matchdayFromKickoff(iso);
}

function normaliseMatch(raw: FootballDataMatch): NormalisedFootballDataMatch {
  const kickoffAt = raw.utcDate;
  const lockTime =
    new Date(kickoffAt).getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000;
  const status = mapFootballDataStatus(raw.status);
  const finished = status === "FT";
  const live = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status);

  const homeScore =
    finished || live ? raw.score.fullTime.home : null;
  const awayScore =
    finished || live ? raw.score.fullTime.away : null;

  return {
    football_data_match_id: raw.id,
    matchday: matchdayFromKickoff(kickoffAt),
    round: inferRound(raw.stage, raw.group),
    stage: inferStage(raw.stage),
    home_team_name: raw.homeTeam.name ?? "",
    home_team_tla: raw.homeTeam.tla || null,
    home_team_logo: raw.homeTeam.crest ?? null,
    away_team_name: raw.awayTeam.name ?? "",
    away_team_tla: raw.awayTeam.tla || null,
    away_team_logo: raw.awayTeam.crest ?? null,
    venue: raw.venue ?? null,
    kickoff_at: kickoffAt,
    status,
    home_score: homeScore,
    away_score: awayScore,
    home_score_halftime: raw.score.halfTime.home,
    away_score_halftime: raw.score.halfTime.away,
    is_locked: Date.now() >= lockTime || !["NS", "TBD"].includes(status),
  };
}

export async function fetchWorldCupMatches(): Promise<NormalisedFootballDataMatch[]> {
  const data = await apiFetch<FootballDataMatchList>(
    `/competitions/${FOOTBALL_DATA_WC_CODE}/matches?season=${FOOTBALL_DATA_WC_SEASON}`
  );
  return data.matches.map(normaliseMatch);
}

export async function fetchLiveWorldCupMatches(): Promise<NormalisedFootballDataMatch[]> {
  const data = await apiFetch<FootballDataMatchList>(
    `/competitions/${FOOTBALL_DATA_WC_CODE}/matches?season=${FOOTBALL_DATA_WC_SEASON}&status=LIVE,IN_PLAY,PAUSED`
  );
  return data.matches.map(normaliseMatch);
}

/** Live plus recently finished matches — used to refresh scores on the Matches page. */
export async function fetchLiveAndFinishedWorldCupMatches(): Promise<
  NormalisedFootballDataMatch[]
> {
  const data = await apiFetch<FootballDataMatchList>(
    `/competitions/${FOOTBALL_DATA_WC_CODE}/matches?season=${FOOTBALL_DATA_WC_SEASON}&status=LIVE,IN_PLAY,PAUSED,FINISHED`
  );
  return data.matches.map(normaliseMatch);
}
