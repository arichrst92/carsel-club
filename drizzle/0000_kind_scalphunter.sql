CREATE TYPE "public"."generation_method" AS ENUM('auto_random', 'auto_mexicano', 'manual_drag');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'live', 'completed');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('host', 'co_host', 'player', 'guest');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."session_format" AS ENUM('americano', 'mexicano', 'tournament');--> statement-breakpoint
CREATE TYPE "public"."session_play_type" AS ENUM('freeplay', 'tournament');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('upcoming', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."session_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "match_round_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"generation_method" "generation_method" DEFAULT 'auto_random' NOT NULL,
	"generated_by" uuid NOT NULL,
	"status" "round_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_mrs_session_round" UNIQUE("session_id","round_number"),
	CONSTRAINT "round_number_positive" CHECK ("match_round_sets"."round_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_round_set_id" uuid NOT NULL,
	"court_number" integer NOT NULL,
	"match_position" integer NOT NULL,
	"team1_p1_id" uuid NOT NULL,
	"team1_p2_id" uuid NOT NULL,
	"team2_p1_id" uuid NOT NULL,
	"team2_p2_id" uuid NOT NULL,
	"team1_score" integer DEFAULT 0 NOT NULL,
	"team2_score" integer DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distinct_players" CHECK (
        "matches"."team1_p1_id" != "matches"."team1_p2_id" AND
        "matches"."team1_p1_id" != "matches"."team2_p1_id" AND
        "matches"."team1_p1_id" != "matches"."team2_p2_id" AND
        "matches"."team1_p2_id" != "matches"."team2_p1_id" AND
        "matches"."team1_p2_id" != "matches"."team2_p2_id" AND
        "matches"."team2_p1_id" != "matches"."team2_p2_id"
      ),
	CONSTRAINT "scores_non_negative" CHECK ("matches"."team1_score" >= 0 AND "matches"."team2_score" >= 0)
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_number" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referred_user_id" uuid,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_name" text,
	"role" "participant_role" DEFAULT 'player' NOT NULL,
	"is_playing" boolean DEFAULT true NOT NULL,
	"session_points" integer DEFAULT 0 NOT NULL,
	"session_matches" integer DEFAULT 0 NOT NULL,
	"session_wins" integer DEFAULT 0 NOT NULL,
	"session_losses" integer DEFAULT 0 NOT NULL,
	"session_draws" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_member" UNIQUE("session_id","user_id"),
	CONSTRAINT "cohost_non_guest" CHECK (
        ("session_participants"."role" IN ('host', 'co_host', 'player') AND "session_participants"."user_id" IS NOT NULL AND "session_participants"."guest_name" IS NULL)
        OR
        ("session_participants"."role" = 'guest' AND "session_participants"."user_id" IS NULL AND "session_participants"."guest_name" IS NOT NULL)
      ),
	CONSTRAINT "session_stats_consistent" CHECK ("session_participants"."session_wins" + "session_participants"."session_losses" + "session_participants"."session_draws" = "session_participants"."session_matches")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"host_id" uuid NOT NULL,
	"venue_name" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"format" "session_format" DEFAULT 'americano' NOT NULL,
	"play_type" "session_play_type" DEFAULT 'freeplay' NOT NULL,
	"visibility" "session_visibility" DEFAULT 'private' NOT NULL,
	"num_courts" integer DEFAULT 1 NOT NULL,
	"status" "session_status" DEFAULT 'upcoming' NOT NULL,
	"fix_partners" boolean DEFAULT false NOT NULL,
	"cover_photo_url" text,
	"description" text,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "num_courts_positive" CHECK ("sessions"."num_courts" > 0 AND "sessions"."num_courts" <= 20)
);
--> statement-breakpoint
CREATE TABLE "tier_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_points" integer DEFAULT 0 NOT NULL,
	"min_matches" integer DEFAULT 0 NOT NULL,
	"icon" text,
	"color" text,
	"display_order" integer NOT NULL,
	CONSTRAINT "tier_definitions_name_unique" UNIQUE("name"),
	CONSTRAINT "tier_definitions_display_order_unique" UNIQUE("display_order")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_number" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"city" text,
	"total_points" integer DEFAULT 0 NOT NULL,
	"total_matches" integer DEFAULT 0 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_losses" integer DEFAULT 0 NOT NULL,
	"total_draws" integer DEFAULT 0 NOT NULL,
	"current_tier_id" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_whatsapp_number_unique" UNIQUE("whatsapp_number"),
	CONSTRAINT "total_stats_consistent" CHECK ("users"."total_wins" + "users"."total_losses" + "users"."total_draws" = "users"."total_matches")
);
--> statement-breakpoint
ALTER TABLE "match_round_sets" ADD CONSTRAINT "match_round_sets_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_round_sets" ADD CONSTRAINT "match_round_sets_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_match_round_set_id_match_round_sets_id_fk" FOREIGN KEY ("match_round_set_id") REFERENCES "public"."match_round_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_p1_id_session_participants_id_fk" FOREIGN KEY ("team1_p1_id") REFERENCES "public"."session_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_p2_id_session_participants_id_fk" FOREIGN KEY ("team1_p2_id") REFERENCES "public"."session_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_p1_id_session_participants_id_fk" FOREIGN KEY ("team2_p1_id") REFERENCES "public"."session_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_p2_id_session_participants_id_fk" FOREIGN KEY ("team2_p2_id") REFERENCES "public"."session_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_current_tier_id_tier_definitions_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."tier_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mrs_session" ON "match_round_sets" USING btree ("session_id","round_number");--> statement-breakpoint
CREATE INDEX "idx_matches_round" ON "matches" USING btree ("match_round_set_id","match_position");--> statement-breakpoint
CREATE INDEX "idx_otp_phone_created" ON "otp_verifications" USING btree ("whatsapp_number","created_at");--> statement-breakpoint
CREATE INDEX "idx_referrals_code" ON "referrals" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "idx_sp_session" ON "session_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sp_user" ON "session_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_host" ON "sessions" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_scheduled" ON "sessions" USING btree ("scheduled_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_users_whatsapp" ON "users" USING btree ("whatsapp_number");--> statement-breakpoint
CREATE INDEX "idx_users_lb_points" ON "users" USING btree ("total_points" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_users_lb_matches" ON "users" USING btree ("total_matches" DESC NULLS LAST);