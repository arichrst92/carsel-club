CREATE TYPE "public"."log_level" AS ENUM('info', 'warn', 'error', 'fatal');--> statement-breakpoint
CREATE TYPE "public"."log_type" AS ENUM('log', 'event');--> statement-breakpoint
CREATE TABLE "app_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "log_type" NOT NULL,
	"level" "log_level",
	"name" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_id" uuid,
	"route" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "log_level_required_for_logs" CHECK (("app_logs"."type" = 'event') OR ("app_logs"."type" = 'log' AND "app_logs"."level" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_lo" uuid NOT NULL,
	"user_id_hi" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_friendship_pair" UNIQUE("user_id_lo","user_id_hi"),
	CONSTRAINT "canonical_pair_order" CHECK ("friendships"."user_id_lo" < "friendships"."user_id_hi")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "scheduled_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "maps_url" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "max_rounds" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_logs" ADD CONSTRAINT "app_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_lo_users_id_fk" FOREIGN KEY ("user_id_lo") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_hi_users_id_fk" FOREIGN KEY ("user_id_hi") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_logs_created" ON "app_logs" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_app_logs_type_level_created" ON "app_logs" USING btree ("type","level","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_app_logs_user_created" ON "app_logs" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_friendship_lo" ON "friendships" USING btree ("user_id_lo");--> statement-breakpoint
CREATE INDEX "idx_friendship_hi" ON "friendships" USING btree ("user_id_hi");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "scheduled_end_after_start" CHECK ("sessions"."scheduled_end_at" IS NULL OR "sessions"."scheduled_end_at" > "sessions"."scheduled_at");