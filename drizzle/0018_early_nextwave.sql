ALTER TABLE "session_participants" ADD COLUMN "pair_key" uuid;--> statement-breakpoint
CREATE INDEX "idx_sp_pair_key" ON "session_participants" USING btree ("session_id","pair_key");