CREATE TYPE "public"."tournament_seeding" AS ENUM('by_join_order', 'random');--> statement-breakpoint
CREATE TABLE "tournament_brackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"seeding_method" "tournament_seeding" DEFAULT 'by_join_order' NOT NULL,
	"total_rounds" integer NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"sponsor_name" text,
	"sponsor_logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_brackets_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bracket_round" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "bracket_slot" integer;--> statement-breakpoint
ALTER TABLE "tournament_brackets" ADD CONSTRAINT "tournament_brackets_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_matches_bracket" ON "matches" USING btree ("match_round_set_id","bracket_round","bracket_slot");