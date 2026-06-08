-- World Cup Predictions — initial schema
-- Run in Supabase SQL editor or via supabase db push

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Private prediction leagues
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX leagues_invite_code_idx ON leagues(invite_code);

-- League membership
CREATE TABLE league_members (
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

-- Cached fixtures from API-Football (World Cup 2026: league=1, season=2026)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_fixture_id INTEGER NOT NULL UNIQUE,
  matchday DATE NOT NULL,
  round TEXT,
  stage TEXT,
  home_team_id INTEGER NOT NULL,
  home_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_id INTEGER NOT NULL,
  away_team_name TEXT NOT NULL,
  away_team_logo TEXT,
  venue TEXT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'NS',
  home_score INTEGER,
  away_score INTEGER,
  home_score_halftime INTEGER,
  away_score_halftime INTEGER,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX matches_matchday_idx ON matches(matchday);
CREATE INDEX matches_kickoff_idx ON matches(kickoff_at);
CREATE INDEX matches_status_idx ON matches(status);

-- Score predictions per match per user per league
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  points_awarded INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id, match_id)
);

CREATE INDEX predictions_league_user_idx ON predictions(league_id, user_id);
CREATE INDEX predictions_match_idx ON predictions(match_id);

-- Captain's pick: one match per matchday worth double points
CREATE TABLE captain_picks (
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matchday DATE NOT NULL,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id, matchday)
);

-- Pre-tournament bracket challenge
CREATE TABLE bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  champion_team_id INTEGER,
  champion_team_name TEXT,
  runner_up_team_id INTEGER,
  runner_up_team_name TEXT,
  semi_finalist_ids INTEGER[] DEFAULT '{}',
  semi_finalist_names TEXT[] DEFAULT '{}',
  points_awarded INTEGER DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

-- Auto-awarded fun badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (league_id, user_id, badge_type)
);

-- Cached AI match previews (Grok)
CREATE TABLE match_previews (
  match_id UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  preview_text TEXT NOT NULL,
  fun_fact TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_previews ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage own profile, read others in shared leagues
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view league member profiles"
  ON profiles FOR SELECT USING (
    id IN (
      SELECT lm.user_id FROM league_members lm
      WHERE lm.league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leagues: members can read; creator can update
CREATE POLICY "Members can view their leagues"
  ON leagues FOR SELECT USING (
    id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create leagues"
  ON leagues FOR INSERT WITH CHECK (auth.uid() = created_by);

-- League members
CREATE POLICY "Members can view league membership"
  ON league_members FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join leagues"
  ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches: readable by all authenticated users
CREATE POLICY "Authenticated users can view matches"
  ON matches FOR SELECT TO authenticated USING (true);

-- Predictions: own predictions + league members can view all in league
CREATE POLICY "Users can manage own predictions"
  ON predictions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "League members can view predictions"
  ON predictions FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

-- Captain picks
CREATE POLICY "Users can manage own captain picks"
  ON captain_picks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "League members can view captain picks"
  ON captain_picks FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

-- Bracket predictions
CREATE POLICY "Users can manage own bracket"
  ON bracket_predictions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "League members can view brackets"
  ON bracket_predictions FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

-- Badges
CREATE POLICY "League members can view badges"
  ON badges FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

-- Match previews: public to authenticated
CREATE POLICY "Authenticated users can view previews"
  ON match_previews FOR SELECT TO authenticated USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
