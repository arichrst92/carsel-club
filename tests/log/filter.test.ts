/**
 * Tests untuk lib/log/filter.ts
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import { describe, it, expect } from "vitest";
import {
  normalizeLogFilter,
  parseRangeString,
  FILTER_DEFAULTS,
} from "@/lib/log/filter";

describe("normalizeLogFilter — defaults", () => {
  it("empty filter → all defaults", () => {
    const r = normalizeLogFilter({}, 1_000_000);
    expect(r.type).toBe(null);
    expect(r.level).toBe(null);
    expect(r.searchQuery).toBe(null);
    expect(r.userId).toBe(null);
    expect(r.limit).toBe(FILTER_DEFAULTS.limit);
    expect(r.offset).toBe(0);
    expect(r.sinceMs).toBe(1_000_000 - FILTER_DEFAULTS.rangeMs);
  });

  it("pass through type, level, userId", () => {
    const r = normalizeLogFilter(
      {
        type: "log",
        level: "error",
        userId: "u1",
      },
      1_000_000
    );
    expect(r.type).toBe("log");
    expect(r.level).toBe("error");
    expect(r.userId).toBe("u1");
  });

  it("trim search query", () => {
    const r = normalizeLogFilter({ searchQuery: "  hello  " }, 1_000_000);
    expect(r.searchQuery).toBe("hello");
  });

  it("empty/whitespace search → null", () => {
    const r1 = normalizeLogFilter({ searchQuery: "" }, 1_000_000);
    const r2 = normalizeLogFilter({ searchQuery: "   " }, 1_000_000);
    expect(r1.searchQuery).toBe(null);
    expect(r2.searchQuery).toBe(null);
  });

  it("respect custom rangeMs", () => {
    const r = normalizeLogFilter({ rangeMs: 5000 }, 100_000);
    expect(r.sinceMs).toBe(95_000);
  });

  it("invalid rangeMs (zero, negative) → default", () => {
    const r1 = normalizeLogFilter({ rangeMs: 0 }, 1_000_000);
    const r2 = normalizeLogFilter({ rangeMs: -100 }, 1_000_000);
    expect(r1.sinceMs).toBe(1_000_000 - FILTER_DEFAULTS.rangeMs);
    expect(r2.sinceMs).toBe(1_000_000 - FILTER_DEFAULTS.rangeMs);
  });
});

describe("normalizeLogFilter — limit bounds", () => {
  it("custom limit honored", () => {
    const r = normalizeLogFilter({ limit: 100 }, 1_000_000);
    expect(r.limit).toBe(100);
  });

  it("cap limit ke MAX_LIMIT", () => {
    const r = normalizeLogFilter({ limit: 9999 }, 1_000_000);
    expect(r.limit).toBe(FILTER_DEFAULTS.maxLimit);
  });

  it("throws kalau limit < 1", () => {
    expect(() => normalizeLogFilter({ limit: 0 }, 1_000_000)).toThrow(
      /limit/i
    );
    expect(() => normalizeLogFilter({ limit: -5 }, 1_000_000)).toThrow();
  });
});

describe("normalizeLogFilter — offset bounds", () => {
  it("custom offset honored", () => {
    const r = normalizeLogFilter({ offset: 100 }, 1_000_000);
    expect(r.offset).toBe(100);
  });

  it("offset zero OK", () => {
    const r = normalizeLogFilter({ offset: 0 }, 1_000_000);
    expect(r.offset).toBe(0);
  });

  it("throws kalau offset negative", () => {
    expect(() => normalizeLogFilter({ offset: -1 }, 1_000_000)).toThrow();
  });
});

describe("parseRangeString", () => {
  it("returns null untuk null/undefined/empty", () => {
    expect(parseRangeString(null)).toBe(null);
    expect(parseRangeString(undefined)).toBe(null);
    expect(parseRangeString("")).toBe(null);
  });

  it("parses minutes 'Nm'", () => {
    expect(parseRangeString("5m")).toBe(5 * 60 * 1000);
    expect(parseRangeString("30m")).toBe(30 * 60 * 1000);
  });

  it("parses hours 'Nh'", () => {
    expect(parseRangeString("1h")).toBe(60 * 60 * 1000);
    expect(parseRangeString("24h")).toBe(24 * 60 * 60 * 1000);
  });

  it("parses days 'Nd'", () => {
    expect(parseRangeString("1d")).toBe(24 * 60 * 60 * 1000);
    expect(parseRangeString("7d")).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns null untuk invalid format", () => {
    expect(parseRangeString("abc")).toBe(null);
    expect(parseRangeString("5x")).toBe(null);
    expect(parseRangeString("h")).toBe(null);
    expect(parseRangeString("5")).toBe(null);
    expect(parseRangeString("5.5h")).toBe(null);
  });

  it("returns null untuk N <= 0", () => {
    expect(parseRangeString("0h")).toBe(null);
  });

  it("multi-digit numbers OK", () => {
    expect(parseRangeString("123m")).toBe(123 * 60 * 1000);
  });
});

describe("FILTER_DEFAULTS", () => {
  it("exports rangeMs=1h, limit=50, maxLimit=200", () => {
    expect(FILTER_DEFAULTS.rangeMs).toBe(60 * 60 * 1000);
    expect(FILTER_DEFAULTS.limit).toBe(50);
    expect(FILTER_DEFAULTS.maxLimit).toBe(200);
  });
});
