/**
 * Tests untuk lib/match/timer.ts
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 4
 */

import { describe, it, expect } from "vitest";
import { formatElapsed, computeElapsedMs } from "@/lib/match/timer";

describe("formatElapsed", () => {
  it("< 10s → 'baru saja'", () => {
    expect(formatElapsed(0)).toBe("baru saja");
    expect(formatElapsed(5_000)).toBe("baru saja");
    expect(formatElapsed(9_999)).toBe("baru saja");
  });

  it("negative ms → 'baru saja'", () => {
    expect(formatElapsed(-1000)).toBe("baru saja");
  });

  it("non-finite → 'baru saja'", () => {
    expect(formatElapsed(NaN)).toBe("baru saja");
    expect(formatElapsed(Infinity)).toBe("baru saja");
  });

  it("10s - 59s → 'Ns'", () => {
    expect(formatElapsed(10_000)).toBe("10s");
    expect(formatElapsed(30_000)).toBe("30s");
    expect(formatElapsed(59_000)).toBe("59s");
  });

  it("1m - 9m 59s → 'Nm Ss'", () => {
    expect(formatElapsed(60_000)).toBe("1m 0s");
    expect(formatElapsed(60_000 + 30_000)).toBe("1m 30s");
    expect(formatElapsed(5 * 60_000 + 12_000)).toBe("5m 12s");
    expect(formatElapsed(9 * 60_000 + 59_000)).toBe("9m 59s");
  });

  it("10m - 59m → 'Nm' (drop seconds)", () => {
    expect(formatElapsed(10 * 60_000)).toBe("10m");
    expect(formatElapsed(15 * 60_000 + 30_000)).toBe("15m");
    expect(formatElapsed(59 * 60_000)).toBe("59m");
  });

  it(">= 1h → 'Hj Mm'", () => {
    expect(formatElapsed(60 * 60_000)).toBe("1j 0m");
    expect(formatElapsed(60 * 60_000 + 30 * 60_000)).toBe("1j 30m");
    expect(formatElapsed(2 * 60 * 60_000)).toBe("2j 0m");
    expect(formatElapsed(3 * 60 * 60_000 + 45 * 60_000 + 12_000)).toBe(
      "3j 45m"
    );
  });
});

describe("computeElapsedMs", () => {
  const NOW = new Date("2026-06-02T12:00:00.000Z");

  it("startedAt null → null", () => {
    expect(computeElapsedMs(null, null, NOW)).toBe(null);
  });

  it("invalid date string → null", () => {
    expect(computeElapsedMs("not-a-date", null, NOW)).toBe(null);
  });

  it("startedAt Date, no end → diff to now", () => {
    const start = new Date("2026-06-02T11:55:00.000Z"); // 5 min before
    expect(computeElapsedMs(start, null, NOW)).toBe(5 * 60_000);
  });

  it("startedAt ISO string", () => {
    expect(computeElapsedMs("2026-06-02T11:55:00.000Z", null, NOW)).toBe(
      5 * 60_000
    );
  });

  it("endedAt set → diff start to end", () => {
    const start = new Date("2026-06-02T11:50:00.000Z");
    const end = new Date("2026-06-02T11:55:00.000Z");
    expect(computeElapsedMs(start, end, NOW)).toBe(5 * 60_000);
  });

  it("endedAt as ISO string", () => {
    expect(
      computeElapsedMs(
        "2026-06-02T11:50:00.000Z",
        "2026-06-02T11:55:00.000Z",
        NOW
      )
    ).toBe(5 * 60_000);
  });

  it("startedAt in future → 0 (no negative)", () => {
    const future = new Date("2026-06-02T12:05:00.000Z");
    expect(computeElapsedMs(future, null, NOW)).toBe(0);
  });

  it("default `now` (no third arg) → uses real Date.now", () => {
    const past = new Date(Date.now() - 1000);
    const result = computeElapsedMs(past);
    expect(result).not.toBe(null);
    expect(result!).toBeGreaterThanOrEqual(900);
  });
});
