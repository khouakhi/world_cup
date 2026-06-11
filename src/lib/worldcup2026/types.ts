/** Raw team record from rezarahiminia/worldcup2026 football.teams.json */
export interface Wc26RawTeam {
  name_en: string;
  name_fa?: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
  id: string;
}

/** Raw match record from rezarahiminia/worldcup2026 football.matches.json */
export interface Wc26RawMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface Wc26Team {
  id: number;
  name: string;
  logo: string | null;
  fifa_code: string;
  group: string;
}
