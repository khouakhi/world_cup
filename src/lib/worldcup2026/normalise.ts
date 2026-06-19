import { matchdayFromKickoff } from "@/lib/utils";
import { loadWc26Matches, loadWc26Teams } from "@/lib/worldcup2026/data";
import type { Wc26RawMatch, Wc26Team } from "@/lib/worldcup2026/types";
import { PREDICTION_LOCK_MINUTES } from "@/types";
import type { Match, MatchStatus } from "@/types";

const ROUND_LABELS: Record<string, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  third: "3rd Place Final",
  final: "Final",
};

/** Fallback when football-data.org has not synced yet — not accurate for US time zones. */
export function parseWc26LocalDate(localDate: string): string {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString();
}

function mapFinishedStatus(raw: Wc26RawMatch): MatchStatus {
  if (raw.finished.toUpperCase() === "TRUE") return "FT";
  const elapsed = raw.time_elapsed.toLowerCase();
  if (elapsed === "halftime") return "HT";
  if (elapsed === "live" || elapsed.includes("min")) return "LIVE";
  return "NS";
}

function inferRound(raw: Wc26RawMatch): string {
  if (raw.type === "group") {
    return `Group Stage - Group ${raw.group}`;
  }
  return ROUND_LABELS[raw.type] ?? raw.type;
}

function inferStage(raw: Wc26RawMatch): string {
  return raw.type === "group" ? "Group Stage" : "Knockout Stage";
}

export function getWc26Teams(): Wc26Team[] {
  return loadWc26Teams().map((team) => ({
    id: parseInt(team.id, 10),
    name: team.name_en,
    logo: team.flag ?? null,
    fifa_code: team.fifa_code,
    group: team.groups,
  }));
}

export function normaliseWc26Match(
  raw: Wc26RawMatch,
  teamsById: Map<number, Wc26Team>
): Omit<Match, "id"> {
  const homeId = parseInt(raw.home_team_id, 10);
  const awayId = parseInt(raw.away_team_id, 10);
  const homeTeam = teamsById.get(homeId);
  const awayTeam = teamsById.get(awayId);

  const kickoffAt = parseWc26LocalDate(raw.local_date);
  const lockTime =
    new Date(kickoffAt).getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000;
  const status = mapFinishedStatus(raw);
  const finished = status === "FT";

  const homeScore = finished ? parseInt(raw.home_score, 10) : null;
  const awayScore = finished ? parseInt(raw.away_score, 10) : null;

  return {
    external_fixture_id: parseInt(raw.id, 10),
    matchday: matchdayFromKickoff(kickoffAt),
    round: inferRound(raw),
    stage: inferStage(raw),
    home_team_id: homeId,
    home_team_name:
      homeTeam?.name ?? raw.home_team_label ?? (homeId === 0 ? "TBD" : "Unknown"),
    home_team_logo: homeTeam?.logo ?? null,
    away_team_id: awayId,
    away_team_name:
      awayTeam?.name ?? raw.away_team_label ?? (awayId === 0 ? "TBD" : "Unknown"),
    away_team_logo: awayTeam?.logo ?? null,
    venue: null,
    kickoff_at: kickoffAt,
    status,
    home_score: Number.isNaN(homeScore) ? null : homeScore,
    away_score: Number.isNaN(awayScore) ? null : awayScore,
    home_score_halftime: null,
    away_score_halftime: null,
    is_locked: Date.now() >= lockTime || !["NS", "TBD"].includes(status),
    api_football_fixture_id: null,
  };
}

export function normaliseAllWc26Matches(): Omit<Match, "id">[] {
  const teams = getWc26Teams();
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  return loadWc26Matches().map((raw) => normaliseWc26Match(raw, teamsById));
}

/** Normalise team names for matching API-Football responses to wc26 data. */
export function normaliseTeamName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Build lookup from normalised names and common aliases to wc26 team ids. */
export function buildTeamNameIndex(): Map<string, number> {
  const index = new Map<string, number>();

  const aliases: Record<string, string[]> = {
    MEX: ["mexico"],
    RSA: ["south africa", "southafrica"],
    KOR: ["south korea", "korea republic", "korearepublic"],
    CZE: ["czech republic", "czechia"],
    CAN: ["canada"],
    BIH: ["bosnia and herzegovina", "bosnia", "bosniaherzegovina", "bosnia h"],
    QAT: ["qatar"],
    SUI: ["switzerland"],
    BRA: ["brazil"],
    MAR: ["morocco"],
    HAI: ["haiti"],
    SCO: ["scotland"],
    USA: ["united states", "usa", "us"],
    PAR: ["paraguay"],
    AUS: ["australia"],
    TUR: ["turkey", "turkiye"],
    GER: ["germany"],
    CUW: ["curacao", "curaçao"],
    CIV: ["ivory coast", "cote divoire", "cotedivoire"],
    ECU: ["ecuador"],
    NED: ["netherlands", "holland"],
    JPN: ["japan"],
    SWE: ["sweden"],
    TUN: ["tunisia"],
    BEL: ["belgium"],
    EGY: ["egypt"],
    IRN: ["iran"],
    NZL: ["new zealand"],
    ESP: ["spain"],
    CPV: ["cape verde"],
    KSA: ["saudi arabia"],
    URU: ["uruguay"],
    FRA: ["france"],
    SEN: ["senegal"],
    IRQ: ["iraq"],
    NOR: ["norway"],
    ARG: ["argentina"],
    ALG: ["algeria"],
    AUT: ["austria"],
    JOR: ["jordan"],
    POR: ["portugal"],
    COD: ["democratic republic of the congo", "dr congo", "congo dr"],
    UZB: ["uzbekistan"],
    COL: ["colombia"],
    ENG: ["england"],
    CRO: ["croatia"],
    GHA: ["ghana"],
    PAN: ["panama"],
  };

  for (const team of getWc26Teams()) {
    index.set(normaliseTeamName(team.name), team.id);
    index.set(team.fifa_code.toLowerCase(), team.id);

    const extra = aliases[team.fifa_code];
    if (extra) {
      for (const alias of extra) {
        index.set(normaliseTeamName(alias), team.id);
      }
    }
  }

  return index;
}

export function resolveWc26TeamId(
  teamName: string,
  nameIndex: Map<string, number>
): number | null {
  return nameIndex.get(normaliseTeamName(teamName)) ?? null;
}
