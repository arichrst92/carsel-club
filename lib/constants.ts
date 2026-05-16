/**
 * App-wide constants.
 */

export const APP_NAME = "Carsel Club";
export const APP_TAGLINE = "Padel Community Indonesia";

/**
 * Scoring rules per match outcome.
 */
export const SCORING = {
  WIN_POINTS: 3,
  DRAW_POINTS: 2,
  LOSS_POINTS: 1,
} as const;

/**
 * Tier definitions (mirror of tier_definitions table seed).
 * Use this for client-side display logic. DB is source of truth.
 */
export const TIERS = [
  { id: 1, name: "Rookie",   minPoints: 0,    minMatches: 0,   color: "#94a3b8", order: 1 },
  { id: 2, name: "Bronze",   minPoints: 50,   minMatches: 10,  color: "#cd7f32", order: 2 },
  { id: 3, name: "Silver",   minPoints: 150,  minMatches: 25,  color: "#c0c0c0", order: 3 },
  { id: 4, name: "Gold",     minPoints: 300,  minMatches: 50,  color: "#ffd700", order: 4 },
  { id: 5, name: "Platinum", minPoints: 600,  minMatches: 100, color: "#e5e4e2", order: 5 },
  { id: 6, name: "Master",   minPoints: 1000, minMatches: 200, color: "#9333ea", order: 6 },
] as const;

/**
 * Session formats.
 */
export const SESSION_FORMATS = ["americano", "mexicano", "tournament"] as const;
export type SessionFormat = (typeof SESSION_FORMATS)[number];

/**
 * Session statuses.
 */
export const SESSION_STATUSES = [
  "upcoming",
  "live",
  "completed",
  "cancelled",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/**
 * Match statuses.
 */
export const MATCH_STATUSES = ["pending", "live", "completed"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/**
 * Participant roles.
 */
export const PARTICIPANT_ROLES = [
  "host",
  "co_host",
  "player",
  "guest",
] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];
