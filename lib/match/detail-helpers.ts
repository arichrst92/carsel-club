/**
 * Pure helpers untuk Match Detail page.
 *
 * Compute per-player outcome & points from match scores, tanpa DB.
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §4.1 (scoring W3/D2/L1)
 * - GUI:  docs/CarselClubPrototype/match-detail.html (hero outcome + points)
 */

import { computeImpact, type Outcome } from "./stats-helpers";

export type PlayerSide = "team1" | "team2";

export type PlayerMatchStats = {
  outcome: Outcome;
  pointsEarned: number;
};

/**
 * Compute outcome + points untuk satu pemain by side.
 */
export function computePlayerStats(
  t1Score: number,
  t2Score: number,
  side: PlayerSide
): PlayerMatchStats {
  const impact = computeImpact(t1Score, t2Score);
  const team = side === "team1" ? impact.team1 : impact.team2;
  return {
    outcome: team.outcome,
    pointsEarned: team.points,
  };
}

/**
 * UI helper: label outcome bahasa Indonesia.
 */
export const OUTCOME_LABEL: Record<Outcome, string> = {
  win: "Menang",
  loss: "Kalah",
  draw: "Seri",
};

export const OUTCOME_EMOJI: Record<Outcome, string> = {
  win: "🏆",
  loss: "💔",
  draw: "🤝",
};

/**
 * UI color per outcome.
 */
export const OUTCOME_COLOR: Record<Outcome, string> = {
  win: "var(--primary-700)",
  loss: "var(--accent-600)",
  draw: "var(--text-700)",
};

export const OUTCOME_BG: Record<Outcome, string> = {
  win: "var(--primary-50)",
  loss: "var(--accent-50)",
  draw: "var(--bg-soft)",
};

/**
 * Apakah team1 menang? Untuk highlighting di UI.
 */
export function team1Won(t1Score: number, t2Score: number): boolean {
  return t1Score > t2Score;
}

export function team2Won(t1Score: number, t2Score: number): boolean {
  return t2Score > t1Score;
}

export function isDraw(t1Score: number, t2Score: number): boolean {
  return t1Score === t2Score;
}
