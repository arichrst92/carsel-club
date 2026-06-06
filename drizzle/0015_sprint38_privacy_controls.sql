CREATE TYPE "public"."friend_request_policy" AS ENUM('anyone', 'friends_of_friends', 'off');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_flags" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "friend_request_policy" "friend_request_policy" DEFAULT 'anyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;