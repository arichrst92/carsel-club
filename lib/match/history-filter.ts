/**
 * Pure helpers untuk Match History filter (Sprint 40).
 *
 * Filter values: "all" | "win" | "loss" | "draw"
 *
 * Used by app/profile/matches/page.tsx via searchParams.
 */

export type HistoryFilter = "all" | "win" | "loss" | "draw";

export const VALID_HISTORY_FILTERS: HistoryFilter[] = [
  "all",
  "win",
  "loss",
  "draw",
];

export function parseHistoryFilter(raw: string | undefined): HistoryFilter {
  if (!raw) return "all";
  return VALID_HISTORY_FILTERS.includes(raw as HistoryFilter)
    ? (raw as HistoryFilter)
    : "all";
}

export const HISTORY_FILTER_LABELS: Record<HistoryFilter, string> = {
  all: "Semua",
  win: "Menang",
  loss: "Kalah",
  draw: "Seri",
};

export function applyHistoryFilter<T extends { outcome: "win" | "loss" | "draw" }>(
  matches: T[],
  filter: HistoryFilter
): T[] {
  if (filter === "all") return matches;
  return matches.filter((m) => m.outcome === filter);
}
