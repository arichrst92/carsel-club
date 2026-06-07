-- Sprint 52: Fix Partners — user-assigned pair_key column
-- Adds nullable uuid column to session_participants. Players in same
-- session sharing the same pair_key are a fixed team for the entire
-- session. Used only when sessions.fix_partners = true.

ALTER TABLE "session_participants" ADD COLUMN "pair_key" uuid;

CREATE INDEX IF NOT EXISTS "idx_sp_pair_key"
  ON "session_participants" ("session_id", "pair_key");
