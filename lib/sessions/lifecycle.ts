/**
 * Session state machine — pure helpers.
 *
 * Implements transitions per docs/CarselClubBackend/STATE_MACHINES.md §1
 * dengan extension: reopen allowed dari completed/cancelled (soft terminal).
 *
 * Allowed transitions:
 *   - upcoming → live          (Start, eksplisit) atau auto via generate round 1
 *   - upcoming → completed     (End — host langsung tutup tanpa pernah live)
 *   - upcoming → cancelled     (Cancel)
 *   - live     → completed     (End)
 *   - live     → cancelled     (Cancel)
 *   - completed → live OR upcoming (Reopen — pilih by hasRounds)
 *   - cancelled → live OR upcoming (Reopen — pilih by hasRounds)
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §1
 * - GUI:  docs/CarselClubPrototype/session-detail.html (status pill + actions)
 * - DB:   sessions.status enum (upcoming|live|completed|cancelled), ended_at
 */

export type SessionStatus = "upcoming" | "live" | "completed" | "cancelled";
export type SessionAction = "start" | "end" | "cancel" | "reopen";

export const STATUS_ORDER: SessionStatus[] = [
  "upcoming",
  "live",
  "completed",
  "cancelled",
];

export const STATUS_LABEL: Record<SessionStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_EMOJI: Record<SessionStatus, string> = {
  upcoming: "📅",
  live: "🔴",
  completed: "✅",
  cancelled: "❌",
};

/**
 * Boleh transition dari `from` ke `to`?
 * Catatan: reopen dimodel sebagai cancelled/completed → live/upcoming.
 */
export function canTransition(
  from: SessionStatus,
  to: SessionStatus
): boolean {
  if (from === to) return false;
  switch (from) {
    case "upcoming":
      return to === "live" || to === "completed" || to === "cancelled";
    case "live":
      return to === "completed" || to === "cancelled";
    case "completed":
      return to === "live" || to === "upcoming"; // reopen
    case "cancelled":
      return to === "live" || to === "upcoming"; // reopen
  }
}

/**
 * Status target untuk aksi End (selalu → completed).
 * Throws kalau action tidak valid dari current status.
 */
export function transitionForEnd(
  current: SessionStatus
): SessionStatus {
  if (!canTransition(current, "completed")) {
    throw new Error(
      `Tidak bisa End dari status '${current}'. Sudah selesai/dibatalkan.`
    );
  }
  return "completed";
}

/**
 * Status target untuk aksi Start (upcoming → live).
 */
export function transitionForStart(
  current: SessionStatus
): SessionStatus {
  if (!canTransition(current, "live")) {
    throw new Error(
      `Tidak bisa Start dari status '${current}'. Hanya dari 'upcoming'.`
    );
  }
  if (current !== "upcoming") {
    throw new Error(
      `Tidak bisa Start dari status '${current}'. Hanya dari 'upcoming'.`
    );
  }
  return "live";
}

/**
 * Status target untuk aksi Cancel (upcoming/live → cancelled).
 */
export function transitionForCancel(
  current: SessionStatus
): SessionStatus {
  if (!canTransition(current, "cancelled")) {
    throw new Error(
      `Tidak bisa Cancel dari status '${current}'. Sudah selesai/dibatalkan.`
    );
  }
  return "cancelled";
}

/**
 * Status target untuk Reopen.
 * - hasRounds=true → live (ada match yg sudah di-generate)
 * - hasRounds=false → upcoming (kembali ke pre-match)
 */
export function transitionForReopen(
  current: SessionStatus,
  hasRounds: boolean
): SessionStatus {
  if (current !== "completed" && current !== "cancelled") {
    throw new Error(
      `Tidak bisa Reopen dari status '${current}'. Hanya dari completed/cancelled.`
    );
  }
  return hasRounds ? "live" : "upcoming";
}

/**
 * Aksi apa saja yang valid dari current status?
 * UI pakai ini untuk render conditional buttons.
 */
export function nextAllowedActions(
  current: SessionStatus
): SessionAction[] {
  switch (current) {
    case "upcoming":
      return ["start", "end", "cancel"];
    case "live":
      return ["end", "cancel"];
    case "completed":
    case "cancelled":
      return ["reopen"];
  }
}

/**
 * Status apakah terminal (untuk regular flow)?
 * Reopen tetap bisa, jadi disebut "soft terminal".
 */
export function isSoftTerminal(status: SessionStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/**
 * Untuk timeline visual — apakah status `s` sudah pernah dilalui
 * berdasarkan currentStatus?
 */
export function isStatusReached(
  s: SessionStatus,
  current: SessionStatus
): boolean {
  if (current === "cancelled") {
    // Cancelled bisa dari upcoming atau live. Asumsi linear timeline:
    // upcoming → cancelled (skip live).
    return s === "upcoming" || s === "cancelled";
  }
  // Linear: upcoming → live → completed
  const order: SessionStatus[] = ["upcoming", "live", "completed"];
  const currentIdx = order.indexOf(current);
  const sIdx = order.indexOf(s);
  if (currentIdx === -1 || sIdx === -1) return false;
  return sIdx <= currentIdx;
}
