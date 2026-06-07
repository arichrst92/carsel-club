/**
 * Match state machine — pure helpers.
 *
 * Per docs/CarselClubBackend/STATE_MACHINES.md §2 + revert extension:
 *
 *   pending ──Start──► live ──End──► completed
 *                       ▲                 │
 *                       └─── Revert ──────┘
 *
 * Allowed transitions:
 *   - pending → live          (Start Match — explicit per prototype)
 *   - pending → completed     (End shortcut: skip pending, score 0-0)
 *   - live    → completed     (End Match)
 *   - completed → live        (Revert — scores preserved, stats reversed)
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §2
 * - GUI:  docs/CarselClubPrototype/match-scoring.html (3 states: pre-match / live / done)
 * - DB:   matches.status enum (pending|live|completed), started_at, ended_at
 */

export type MatchStatus = "pending" | "live" | "completed";
export type MatchAction = "start" | "end" | "revert" | "edit";

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  pending: "Pending",
  live: "LIVE",
  completed: "Completed",
};

export const MATCH_STATUS_EMOJI: Record<MatchStatus, string> = {
  pending: "⏳",
  live: "🔴",
  completed: "✅",
};

export function canMatchTransition(
  from: MatchStatus,
  to: MatchStatus
): boolean {
  if (from === to) return false;
  switch (from) {
    case "pending":
      return to === "live" || to === "completed";
    case "live":
      return to === "completed";
    case "completed":
      return to === "live";
  }
}

/**
 * Status target untuk Start Match (pending → live).
 */
export function transitionForMatchStart(
  current: MatchStatus
): MatchStatus {
  if (current !== "pending") {
    throw new Error(
      `Tidak bisa Start dari status '${current}'. Hanya dari 'pending'.`
    );
  }
  return "live";
}

/**
 * Status target untuk End Match (pending/live → completed).
 */
export function transitionForMatchEnd(
  current: MatchStatus
): MatchStatus {
  if (!canMatchTransition(current, "completed")) {
    throw new Error(
      `Tidak bisa End dari status '${current}'. Sudah completed.`
    );
  }
  return "completed";
}

/**
 * Status target untuk Revert (completed → live).
 */
export function transitionForMatchRevert(
  current: MatchStatus
): MatchStatus {
  if (current !== "completed") {
    throw new Error(
      `Tidak bisa Revert dari status '${current}'. Hanya dari 'completed'.`
    );
  }
  return "live";
}

/**
 * Apakah score-adjust (+/− buttons) boleh dari status ini?
 * Strict: pending requires explicit Start dulu.
 */
export function canAdjustScore(status: MatchStatus): boolean {
  return status === "live";
}

export function nextAllowedMatchActions(
  status: MatchStatus
): MatchAction[] {
  switch (status) {
    case "pending":
      return ["start", "end"]; // end shortcut: 0-0
    case "live":
      return ["end"];
    case "completed":
      return ["revert", "edit"];
  }
}
