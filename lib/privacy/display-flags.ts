/**
 * Pure helpers untuk per-field display privacy (Sprint 38).
 *
 * DisplayFlags is per-user JSONB; missing keys default to true (= show).
 * Filtering only kicks in for non-self viewers — the user always sees their own data.
 *
 * Refs:
 * - DB: users.display_flags JSONB
 * - Used by: public profile query + share image routes
 */

export type DisplayFlags = {
  showCity?: boolean;
  showStats?: boolean;
  showAchievements?: boolean;
  showMatches?: boolean;
};

export const DEFAULT_DISPLAY_FLAGS: Required<DisplayFlags> = {
  showCity: true,
  showStats: true,
  showAchievements: true,
  showMatches: true,
};

export const DISPLAY_FLAG_LABELS: Record<keyof DisplayFlags, string> = {
  showCity: "Show city on public profile",
  showStats: "Show stats (points, matches, win rate)",
  showAchievements: "Show unlocked achievements",
  showMatches: "Show recent matches",
};

/**
 * Resolve effective flags (missing keys → defaults).
 */
export function resolveDisplayFlags(
  raw: unknown
): Required<DisplayFlags> {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_DISPLAY_FLAGS };
  const obj = raw as Record<string, unknown>;
  const out: Required<DisplayFlags> = { ...DEFAULT_DISPLAY_FLAGS };
  for (const k of Object.keys(DEFAULT_DISPLAY_FLAGS) as (keyof DisplayFlags)[]) {
    if (typeof obj[k] === "boolean") out[k] = obj[k] as boolean;
  }
  return out;
}

/**
 * Sanitize form-submitted flags before persisting.
 * Drops unknown keys, coerces to booleans.
 */
export function sanitizeDisplayFlags(raw: unknown): DisplayFlags {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const out: DisplayFlags = {};
  for (const k of Object.keys(DEFAULT_DISPLAY_FLAGS) as (keyof DisplayFlags)[]) {
    if (typeof obj[k] === "boolean") out[k] = obj[k];
  }
  return out;
}

/**
 * Apply visibility mask to a profile-like object for non-self viewers.
 * Self-viewers (isSelf=true) get untouched data.
 */
export type Maskable = {
  city?: string | null;
  totalPoints?: number;
  totalMatches?: number;
  totalWins?: number;
  totalLosses?: number;
  totalDraws?: number;
};

export function applyDisplayMask<T extends Maskable>(
  profile: T,
  flags: Required<DisplayFlags>,
  isSelf: boolean
): T {
  if (isSelf) return profile;
  const out: T = { ...profile };
  if (!flags.showCity) out.city = null;
  if (!flags.showStats) {
    if ("totalPoints" in out) out.totalPoints = 0;
    if ("totalMatches" in out) out.totalMatches = 0;
    if ("totalWins" in out) out.totalWins = 0;
    if ("totalLosses" in out) out.totalLosses = 0;
    if ("totalDraws" in out) out.totalDraws = 0;
  }
  return out;
}
