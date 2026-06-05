/**
 * Smart default round count per format (Sprint 14).
 *
 * Per docs/PADEL_APP_KONSEP.md §3.3 (Smart Default):
 * - Americano (no fix partner): n−1
 * - Americano + fix partner:    (n/2)−1
 * - Mexicano:                   5–7 (default 6)
 *
 * Pure — no DB.
 */

export type RoundCountFormat = "americano" | "mexicano" | "tournament";

export type RoundCountInput = {
  format: RoundCountFormat;
  fixPartners: boolean;
  /** Total participant aktif yang akan ikut session */
  playerCount: number;
};

export type RoundCountSuggestion = {
  suggested: number;
  /** Bilangan minimum yang masih masuk akal (untuk UI hint) */
  min: number;
  /** Maksimum yg masih masuk akal */
  max: number;
  /** Penjelasan untuk UI (mis. "n-1 Americano") */
  reason: string;
};

const MEXICANO_DEFAULT = 6;
const MEXICANO_MIN = 5;
const MEXICANO_MAX = 7;
const ABSOLUTE_MIN = 1;
const ABSOLUTE_MAX = 30;

/**
 * Returns suggested + min/max + reason untuk UI hint.
 *
 * Handle edge cases:
 * - playerCount < 4 → return min=1 (UI lain udah block sebelumnya)
 * - fixPartners + odd playerCount → round up (gunakan n+1 untuk hitungan pair)
 */
export function suggestRoundCount(
  input: RoundCountInput
): RoundCountSuggestion {
  const n = Math.max(0, Math.floor(input.playerCount));

  if (input.format === "mexicano") {
    return {
      suggested: MEXICANO_DEFAULT,
      min: MEXICANO_MIN,
      max: MEXICANO_MAX,
      reason: "Mexicano default 6 round (5-7 disarankan)",
    };
  }

  // Americano atau Tournament — share math, label berbeda
  const label =
    input.format === "tournament" ? "Tournament" : "Americano";

  if (input.fixPartners) {
    const pairs = Math.ceil(n / 2);
    const suggested = Math.max(ABSOLUTE_MIN, pairs - 1);
    return {
      suggested: clamp(suggested),
      min: ABSOLUTE_MIN,
      max: ABSOLUTE_MAX,
      reason: `${label} + Fix Partners: ${pairs} pair → ${suggested} round`,
    };
  }

  const suggested = Math.max(ABSOLUTE_MIN, n - 1);
  return {
    suggested: clamp(suggested),
    min: ABSOLUTE_MIN,
    max: ABSOLUTE_MAX,
    reason: `${label}: ${n} pemain → ${suggested} round`,
  };
}

/**
 * Clamp ke max — min sudah di-handle Math.max di call sites.
 */
function clamp(n: number): number {
  return n > ABSOLUTE_MAX ? ABSOLUTE_MAX : n;
}

export const ROUND_COUNT_CONFIG = {
  americanoDefault: (n: number) => Math.max(1, n - 1),
  americanoFixPartnersDefault: (n: number) =>
    Math.max(1, Math.ceil(n / 2) - 1),
  mexicanoDefault: MEXICANO_DEFAULT,
  mexicanoRange: [MEXICANO_MIN, MEXICANO_MAX] as const,
  absoluteRange: [ABSOLUTE_MIN, ABSOLUTE_MAX] as const,
} as const;
