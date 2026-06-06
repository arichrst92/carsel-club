/**
 * Type definitions untuk log/event system.
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2 (revised: self-hosted /monitor)
 */

export type LogLevel = "info" | "warn" | "error" | "fatal";
export type LogType = "log" | "event";

/** Arbitrary key-value context attached to a log entry. */
export type LogContext = Record<string, unknown>;

/** Event names yang di-instrument oleh app. */
export type EventName =
  | "signup"
  | "login"
  | "session_created"
  | "session_started" // Sprint 3
  | "session_ended" // Sprint 3
  | "session_cancelled"
  | "session_reopened" // Sprint 3
  | "round_generated"
  | "round_regenerated" // Sprint 14
  | "match_swap" // Sprint 15
  | "session_edited" // Sprint 18
  | "guest_joined" // Sprint 19
  | "join_requested" // Sprint 20
  | "join_approved" // Sprint 20
  | "join_rejected" // Sprint 20
  | "friend_request_sent" // Sprint 22
  | "friend_request_accepted" // Sprint 22
  | "friend_request_rejected" // Sprint 22
  | "user_blocked" // Sprint 23
  | "user_unblocked" // Sprint 23
  | "user_followed" // Sprint 23
  | "user_unfollowed" // Sprint 23
  | "profile_visibility_changed" // Sprint 24
  | "match_started" // Sprint 4
  | "match_completed"
  | "match_reverted" // Sprint 4
  | "tier_up" // Sprint 12
  | "session_reminder_sent" // Sprint 28
  | "bracket_generated" // Sprint 31
  | "bracket_advanced" // Sprint 31
  | "referral_claimed"
  | "upload_success";

export type LogPayload = {
  type: LogType;
  level: LogLevel | null;
  name: string;
  context: LogContext;
  userId: string | null;
  route: string | null;
  userAgent: string | null;
};
