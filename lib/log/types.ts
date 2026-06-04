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
  | "match_started" // Sprint 4
  | "match_completed"
  | "match_reverted" // Sprint 4
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
