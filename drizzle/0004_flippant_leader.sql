CREATE TYPE "public"."join_policy" AS ENUM('auto_join', 'need_approval');--> statement-breakpoint
CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "session_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"message" text,
	CONSTRAINT "uq_join_req_session_user_pending" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "join_policy" "join_policy" DEFAULT 'auto_join' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_join_requests" ADD CONSTRAINT "session_join_requests_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_join_requests" ADD CONSTRAINT "session_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_join_requests" ADD CONSTRAINT "session_join_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_join_req_session_status" ON "session_join_requests" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "idx_join_req_user" ON "session_join_requests" USING btree ("user_id");