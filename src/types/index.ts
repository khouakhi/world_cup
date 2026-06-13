export type MatchStatus =
  | "NS"
  | "TBD"
  | "1H"
  | "HT"
  | "2H"
  | "ET"
  | "P"
  | "FT"
  | "AET"
  | "PEN"
  | "PST"
  | "CANC"
  | "ABD"
  | "AWD"
  | "WO"
  | "LIVE";

export type BadgeType =
  | "oracle"
  | "chaos_agent"
  | "captain_clutch"
  | "group_guru"
  | "knockout_king"
  | "exact_score_streak";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface LeagueMember {
  league_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface Match {
  id: string;
  external_fixture_id: number;
  /** Set when matched to a football-data.org fixture for schedule and live sync. */
  football_data_match_id?: number | null;
  /** @deprecated API-Football — use football_data_match_id instead */
  api_football_fixture_id?: number | null;
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
  home_score_halftime?: number | null;
  away_score_halftime?: number | null;
  is_locked: boolean;
}

export interface Prediction {
  id: string;
  league_id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points_awarded: number | null;
  /** When true, auto-scoring skips this pick (e.g. pre-league test bets). */
  scoring_excluded?: boolean;
  submitted_at: string;
  match?: Match;
}

export interface CaptainPick {
  league_id: string;
  user_id: string;
  matchday: string;
  match_id: string;
}

export interface BracketPrediction {
  id: string;
  league_id: string;
  user_id: string;
  champion_team_id: number | null;
  champion_team_name: string | null;
  runner_up_team_id: number | null;
  runner_up_team_name: string | null;
  semi_finalist_ids: number[];
  semi_finalist_names: string[];
  points_awarded: number;
  is_locked: boolean;
  submitted_at: string;
}

export interface Badge {
  id: string;
  league_id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_at: string;
  metadata: Record<string, unknown>;
}

export interface MatchPreview {
  match_id: string;
  preview_text: string;
  fun_fact: string | null;
  generated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  match_points: number;
  bracket_points: number;
  total_points: number;
  exact_scores: number;
  rank: number;
}

export interface MatchdayLeaderboardEntry {
  user_id: string;
  display_name: string;
  points: number;
  rank: number;
}

export const BADGE_LABELS: Record<BadgeType, { title: string; description: string; emoji: string }> = {
  oracle: {
    title: "Mystic Meg",
    emoji: "🔮",
    description: "Three exact scores in a row. Absolutely insufferable.",
  },
  chaos_agent: {
    title: "Chaos Merchant",
    emoji: "🎲",
    description: "Bold wrong predictions that still caused group chat chaos",
  },
  captain_clutch: {
    title: "Proper Order",
    emoji: "⭐",
    description: "Banker pick landed maximum points. House bet paid off.",
  },
  group_guru: {
    title: "Group Stage Guru",
    emoji: "📊",
    description: "Top of the table when the group stage finishes",
  },
  knockout_king: {
    title: "Knockout King",
    emoji: "👑",
    description: "Top scorer when it actually matters",
  },
  exact_score_streak: {
    title: "Scoreline Sniper",
    emoji: "🎯",
    description: "Five or more exact scores. Stats nonce behaviour.",
  },
};

export const BRACKET_POINTS = {
  champion: 20,
  runnerUp: 10,
  semiFinalist: 5,
} as const;

export const WORLD_CUP_LEAGUE_ID = 1;
/** Tournament year the app is built for (display). API season may differ on free tier. */
export const WORLD_CUP_SEASON = 2026;
export const PREDICTION_LOCK_MINUTES = 15;
