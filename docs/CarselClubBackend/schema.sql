-- ============================================================
-- CARSEL CLUB — Database Schema v1
-- Target: Supabase (Postgres 15)
-- Generated: 2026-05-11
-- ============================================================
-- Execution: paste into Supabase SQL Editor and run.
-- Order matters: enums → tables → indices → triggers → RLS.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

CREATE TYPE session_format AS ENUM ('americano', 'mexicano', 'tournament');
CREATE TYPE session_play_type AS ENUM ('freeplay', 'tournament');
CREATE TYPE session_visibility AS ENUM ('public', 'private');
CREATE TYPE session_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');
CREATE TYPE participant_role AS ENUM ('host', 'co_host', 'player', 'guest');
CREATE TYPE round_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE match_status AS ENUM ('pending', 'live', 'completed');
CREATE TYPE generation_method AS ENUM ('auto_random', 'auto_mexicano', 'manual_drag');

-- ============================================================
-- 3. TIER DEFINITIONS (seeded reference data)
-- ============================================================

CREATE TABLE tier_definitions (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  min_points   INT  NOT NULL DEFAULT 0,
  min_matches  INT  NOT NULL DEFAULT 0,
  icon         TEXT,
  color        TEXT,
  display_order INT NOT NULL UNIQUE
);

-- Seed: 6 tier (sesuai konsep doc)
INSERT INTO tier_definitions (name, min_points, min_matches, icon, color, display_order) VALUES
  ('Rookie',    0,     0,   'rookie',    '#9CA3AF', 1),
  ('Bronze',    50,    10,  'bronze',    '#CD7F32', 2),
  ('Silver',    150,   25,  'silver',    '#C0C0C0', 3),
  ('Gold',      300,   50,  'gold',      '#FFD700', 4),
  ('Platinum',  600,   100, 'platinum',  '#E5E4E2', 5),
  ('Master',    1000,  200, 'master',    '#9333EA', 6);

-- NOTE: threshold (min_points, min_matches) bisa di-tune kapan saja
-- tanpa redeploy. Tier re-evaluation jalan saat stats user berubah.

-- ============================================================
-- 4. USERS (profile + denormalized lifetime stats)
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number   TEXT NOT NULL UNIQUE, -- E.164 format e.g. +6281234567890
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,
  city              TEXT,

  -- Denormalized lifetime stats (synced saat match completed/edited)
  total_points      INT NOT NULL DEFAULT 0,
  total_matches     INT NOT NULL DEFAULT 0,
  total_wins        INT NOT NULL DEFAULT 0,
  total_losses      INT NOT NULL DEFAULT 0,
  total_draws       INT NOT NULL DEFAULT 0,
  current_tier_id   INT REFERENCES tier_definitions(id) DEFAULT 1, -- Rookie

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT total_stats_consistent CHECK (
    total_wins + total_losses + total_draws = total_matches
  )
);

CREATE INDEX idx_users_whatsapp     ON users (whatsapp_number);
CREATE INDEX idx_users_lb_points    ON users (total_points DESC);
CREATE INDEX idx_users_lb_matches   ON users (total_matches DESC);
-- Win rate leaderboard: gunakan computed column atau hitung di app
-- (avoid generated column to keep schema simple for v1)

-- ============================================================
-- 5. OTP VERIFICATIONS (Fonnte custom flow)
-- ============================================================

CREATE TABLE otp_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL,
  code_hash       TEXT NOT NULL, -- store hash (bcrypt/sha256), NEVER raw code
  expires_at      TIMESTAMPTZ NOT NULL,
  attempts        INT NOT NULL DEFAULT 0,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active OTP lookup by phone number
CREATE INDEX idx_otp_active ON otp_verifications (whatsapp_number, expires_at)
  WHERE verified_at IS NULL;

-- Cleanup helper: delete expired OTPs older than 1 day
-- (run via cron or scheduled task)

-- ============================================================
-- 6. REFERRALS
-- ============================================================

CREATE TABLE referrals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE, -- short code e.g. 'ARI-2X8K'
  referrer_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  claimed_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_code     ON referrals (code);
CREATE INDEX idx_referrals_referrer ON referrals (referrer_user_id);

-- ============================================================
-- 7. SESSIONS
-- ============================================================

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  host_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  venue_name      TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  format          session_format     NOT NULL DEFAULT 'americano',
  play_type       session_play_type  NOT NULL DEFAULT 'freeplay',
  visibility      session_visibility NOT NULL DEFAULT 'private',
  num_courts      INT NOT NULL DEFAULT 1 CHECK (num_courts > 0 AND num_courts <= 20),
  status          session_status NOT NULL DEFAULT 'upcoming',
  fix_partners    BOOLEAN NOT NULL DEFAULT FALSE,
  cover_photo_url TEXT,
  description     TEXT,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_host        ON sessions (host_id);
CREATE INDEX idx_sessions_scheduled   ON sessions (scheduled_at DESC);
CREATE INDEX idx_sessions_active      ON sessions (status, scheduled_at DESC)
  WHERE status IN ('upcoming', 'live');
CREATE INDEX idx_sessions_public      ON sessions (visibility, scheduled_at DESC)
  WHERE visibility = 'public';

-- ============================================================
-- 8. SESSION PARTICIPANTS
-- ============================================================

CREATE TABLE session_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name      TEXT, -- only when user_id IS NULL (guest)
  role            participant_role NOT NULL DEFAULT 'player',
  is_playing      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Session-scope denormalized stats
  session_points  INT NOT NULL DEFAULT 0,
  session_matches INT NOT NULL DEFAULT 0,
  session_wins    INT NOT NULL DEFAULT 0,
  session_losses  INT NOT NULL DEFAULT 0,
  session_draws   INT NOT NULL DEFAULT 0,

  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- G4: Cohost & host MUST be member (have user_id), NOT guest
  CONSTRAINT cohost_non_guest CHECK (
    (role IN ('host', 'co_host', 'player') AND user_id IS NOT NULL AND guest_name IS NULL)
    OR
    (role = 'guest' AND user_id IS NULL AND guest_name IS NOT NULL)
  ),

  -- Session-scope stats consistency
  CONSTRAINT session_stats_consistent CHECK (
    session_wins + session_losses + session_draws = session_matches
  ),

  -- One member per session (uniqueness). Guests can repeat by name.
  UNIQUE (session_id, user_id) -- NULL user_id (guest) tidak constrained
);

CREATE INDEX idx_sp_session       ON session_participants (session_id);
CREATE INDEX idx_sp_user          ON session_participants (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sp_session_play  ON session_participants (session_id, is_playing)
  WHERE is_playing = TRUE;
CREATE INDEX idx_sp_session_lb    ON session_participants (session_id, session_points DESC);

-- ============================================================
-- 9. MATCH ROUND SETS (batch generate matches per round)
-- ============================================================

CREATE TABLE match_round_sets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number       INT NOT NULL CHECK (round_number > 0),
  generation_method  generation_method NOT NULL DEFAULT 'auto_random',
  generated_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status             round_status NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (session_id, round_number)
);

CREATE INDEX idx_mrs_session ON match_round_sets (session_id, round_number);

-- ============================================================
-- 10. MATCHES
-- ============================================================

CREATE TABLE matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_round_set_id  UUID NOT NULL REFERENCES match_round_sets(id) ON DELETE CASCADE,
  court_number        INT NOT NULL CHECK (court_number > 0),
  match_position      INT NOT NULL CHECK (match_position > 0), -- urutan dalam round

  team1_p1_id  UUID NOT NULL REFERENCES session_participants(id) ON DELETE RESTRICT,
  team1_p2_id  UUID NOT NULL REFERENCES session_participants(id) ON DELETE RESTRICT,
  team2_p1_id  UUID NOT NULL REFERENCES session_participants(id) ON DELETE RESTRICT,
  team2_p2_id  UUID NOT NULL REFERENCES session_participants(id) ON DELETE RESTRICT,

  team1_score  INT NOT NULL DEFAULT 0 CHECK (team1_score >= 0),
  team2_score  INT NOT NULL DEFAULT 0 CHECK (team2_score >= 0),

  status       match_status NOT NULL DEFAULT 'pending',
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- All 4 players must be different
  CONSTRAINT distinct_players CHECK (
    team1_p1_id != team1_p2_id AND
    team1_p1_id != team2_p1_id AND
    team1_p1_id != team2_p2_id AND
    team1_p2_id != team2_p1_id AND
    team1_p2_id != team2_p2_id AND
    team2_p1_id != team2_p2_id
  )
);

CREATE INDEX idx_matches_round   ON matches (match_round_set_id, match_position);
CREATE INDEX idx_matches_status  ON matches (status) WHERE status IN ('pending', 'live');
CREATE INDEX idx_matches_team1_p1 ON matches (team1_p1_id);
CREATE INDEX idx_matches_team1_p2 ON matches (team1_p2_id);
CREATE INDEX idx_matches_team2_p1 ON matches (team2_p1_id);
CREATE INDEX idx_matches_team2_p2 ON matches (team2_p2_id);
-- Index per-player FK supports "avoid repeat partners" algorithm queries

-- ============================================================
-- 11. TRIGGERS
-- ============================================================

-- Auto-update updated_at on row update
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- NOTE: Stats sync (match score → user/participant stats) di-handle
-- di Next.js Server Action layer (atomic transaction), TIDAK di trigger DB.
-- Alasan: edit-after-completed (G3) butuh reverse-then-apply logic yang
-- lebih clean di TypeScript dengan type-safe + version control.
-- Lihat STATE_MACHINES.md untuk pseudocode lengkap.

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_round_sets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_definitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals            ENABLE ROW LEVEL SECURITY;

-- v1 strategy: Server Actions di Next.js pakai service_role key,
-- yang otomatis bypass RLS. Authorization logic ada di app layer.
-- RLS di sini sebagai defense-in-depth untuk direct client queries
-- (jika nanti pakai Supabase JS client dari browser untuk realtime).

-- Tier definitions: world-readable
CREATE POLICY "tier_definitions: all read"
  ON tier_definitions FOR SELECT
  USING (true);

-- Users: profile read by all authenticated (untuk leaderboard, avatar, dll)
CREATE POLICY "users: read by all"
  ON users FOR SELECT
  USING (true);

-- Sessions: public sessions visible to all; private requires participation check (handled in app)
CREATE POLICY "sessions: public visible"
  ON sessions FOR SELECT
  USING (visibility = 'public');

-- Matches in public sessions: visible to all (untuk live match share link)
-- For private sessions: handled via service_role in app
CREATE POLICY "matches: visible in public sessions"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_round_sets mrs
      JOIN sessions s ON s.id = mrs.session_id
      WHERE mrs.id = matches.match_round_set_id
        AND s.visibility = 'public'
    )
  );

-- Same pattern for participants & round sets in public sessions
CREATE POLICY "session_participants: visible in public sessions"
  ON session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE id = session_participants.session_id
        AND visibility = 'public'
    )
  );

CREATE POLICY "match_round_sets: visible in public sessions"
  ON match_round_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE id = match_round_sets.session_id
        AND visibility = 'public'
    )
  );

-- OTP & Referrals: NO public read policy. Always via service_role.

-- ============================================================
-- 13. REALTIME PUBLICATION
-- ============================================================
-- Enable Supabase Realtime broadcast untuk tables yang dipakai live sharing.
-- Run setelah schema applied:

ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_round_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Client subscribe pattern (TypeScript):
--   supabase.channel(`session:${sessionId}`)
--     .on('postgres_changes', { event: '*', schema: 'public',
--          table: 'matches',
--          filter: `match_round_set_id=in.(${roundSetIds.join(',')})` }, handler)
--     .subscribe()

-- ============================================================
-- END OF SCHEMA v1
-- ============================================================
-- Verification queries (run after apply):
--   SELECT * FROM tier_definitions ORDER BY display_order;
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--   SELECT enumlabel FROM pg_enum WHERE enumtypid = 'session_status'::regtype;
