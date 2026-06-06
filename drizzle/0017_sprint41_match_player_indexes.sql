CREATE INDEX "idx_matches_t1p1" ON "matches" USING btree ("team1_p1_id");--> statement-breakpoint
CREATE INDEX "idx_matches_t1p2" ON "matches" USING btree ("team1_p2_id");--> statement-breakpoint
CREATE INDEX "idx_matches_t2p1" ON "matches" USING btree ("team2_p1_id");--> statement-breakpoint
CREATE INDEX "idx_matches_t2p2" ON "matches" USING btree ("team2_p2_id");