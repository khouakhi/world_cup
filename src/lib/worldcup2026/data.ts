import teamsJson from "../../../data/worldcup2026/football.teams.json";
import matchesJson from "../../../data/worldcup2026/football.matches.json";
import type { Wc26RawMatch, Wc26RawTeam } from "@/lib/worldcup2026/types";

export function loadWc26Teams(): Wc26RawTeam[] {
  return teamsJson as Wc26RawTeam[];
}

export function loadWc26Matches(): Wc26RawMatch[] {
  return matchesJson as Wc26RawMatch[];
}
