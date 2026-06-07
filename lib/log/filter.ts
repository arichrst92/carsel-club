/**
 * Pure filter logic — converts UI filter state → DB query conditions.
 *
 * Tidak punya DB I/O — output adalah object yang caller (query layer) bisa
 * convert ke Drizzle conditions. Pure supaya 100% testable.
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import type { LogLevel, LogType } from "./types";

export type LogFilter = {
  type?: LogType | null;
  level?: LogLevel | null;
  searchQuery?: string | null;
  userId?: string | null;
  /** Time range in milliseconds back from now. Default 1 hour. */
  rangeMs?: number;
  /** Page size for pagination (default 50, max 200). */
  limit?: number;
  /** Skip rows for pagination. */
  offset?: number;
};

export type NormalizedLogFilter = {
  type: LogType | null;
  level: LogLevel | null;
  searchQuery: string | null;
  userId: string | null;
  sinceMs: number; // epoch ms
  limit: number;
  offset: number;
};

const DEFAULT_RANGE_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Normalize raw filter input ke clean object dengan defaults + bounds.
 * Throws kalau filter invalid (mis. limit negative).
 *
 * @param now epoch ms — injectable for tests.
 */
export function normalizeLogFilter(
  filter: LogFilter,
  now: number = Date.now()
): NormalizedLogFilter {
  const range =
    filter.rangeMs !== undefined && filter.rangeMs > 0
      ? filter.rangeMs
      : DEFAULT_RANGE_MS;

  const rawLimit = filter.limit ?? DEFAULT_LIMIT;
  if (rawLimit < 1) {
    throw new Error("limit must be >= 1");
  }
  const limit = Math.min(rawLimit, MAX_LIMIT);

  const offset = filter.offset ?? 0;
  if (offset < 0) {
    throw new Error("offset must be >= 0");
  }

  const searchQuery = filter.searchQuery?.trim();

  return {
    type: filter.type ?? null,
    level: filter.level ?? null,
    searchQuery: searchQuery && searchQuery.length > 0 ? searchQuery : null,
    userId: filter.userId ?? null,
    sinceMs: now - range,
    limit,
    offset,
  };
}

export const FILTER_DEFAULTS = {
  rangeMs: DEFAULT_RANGE_MS,
  limit: DEFAULT_LIMIT,
  maxLimit: MAX_LIMIT,
} as const;

/**
 * Parse range string from URL params:
 * "5m", "1h", "24h", "7d" → milliseconds. Returns null kalau invalid.
 */
export function parseRangeString(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(/^(\d+)([mhd])$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (n <= 0) return null;
  switch (unit) {
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    /* v8 ignore next 2 */
    default:
      return null;
  }
}
