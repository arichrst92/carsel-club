/**
 * Time-window helpers for leaderboard period filter (Sprint 32).
 *
 * Window semantics:
 * - weekly  → last 7 calendar days (since now - 7d)
 * - monthly → last 30 days
 * - all_time → since (epoch / null)
 *
 * Pure — `now` passed in for testability.
 */

import type { LeaderboardPeriod } from "./types";

export function periodSinceDate(
  now: Date,
  period: LeaderboardPeriod
): Date | null {
  if (period === "all_time") return null;
  const since = new Date(now.getTime());
  if (period === "weekly") {
    since.setDate(since.getDate() - 7);
  } else {
    // monthly
    since.setDate(since.getDate() - 30);
  }
  return since;
}

export function periodLabel(period: LeaderboardPeriod): string {
  switch (period) {
    case "all_time":
      return "Sepanjang masa";
    case "monthly":
      return "30 hari terakhir";
    case "weekly":
      return "7 hari terakhir";
  }
}
