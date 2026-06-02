/**
 * Tests untuk lib/utils.ts
 *
 * Refs:
 * - Helpers shared across UI dan Server Actions
 * - Locale: id-ID throughout (UI bahasa Indonesia)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  cn,
  formatNumber,
  formatDate,
  formatTime,
  formatTimeRange,
  formatDuration,
  winRate,
  sleep,
} from "@/lib/utils";

describe("cn (tailwind merge)", () => {
  it("merge non-conflicting classes", () => {
    expect(cn("p-4", "text-red-500")).toBe("p-4 text-red-500");
  });

  it("conflicting tailwind utility — later wins", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
  });

  it("conditional className via clsx falsy filter", () => {
    expect(cn("p-4", false && "text-primary", "text-red-500")).toBe(
      "p-4 text-red-500"
    );
  });

  it("empty inputs → empty string", () => {
    expect(cn()).toBe("");
  });

  it("undefined/null filtered", () => {
    expect(cn("p-4", undefined, null, "m-2")).toBe("p-4 m-2");
  });
});

describe("formatNumber", () => {
  it("formats with id-ID thousand separator", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("zero → '0'", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("small numbers tanpa separator", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("negative numbers", () => {
    expect(formatNumber(-1234)).toBe("-1.234");
  });
});

describe("formatDate", () => {
  it("Date object → id-ID short format", () => {
    // 2026-05-11 = 11 Mei 2026
    expect(formatDate(new Date(2026, 4, 11))).toMatch(/11.*Mei.*2026/);
  });

  it("ISO string input", () => {
    expect(formatDate("2026-05-11T10:00:00")).toMatch(/11.*Mei.*2026/);
  });

  it("January (Jan label)", () => {
    expect(formatDate(new Date(2026, 0, 1))).toMatch(/Jan/);
  });

  it("December (Des label di id-ID)", () => {
    expect(formatDate(new Date(2026, 11, 25))).toMatch(/Des/);
  });
});

describe("formatTime", () => {
  it("Date → HH:mm 24h format", () => {
    expect(formatTime(new Date(2026, 4, 11, 16, 30))).toBe("16.30");
  });

  it("midnight 00:00", () => {
    expect(formatTime(new Date(2026, 4, 11, 0, 0))).toBe("00.00");
  });

  it("ISO string input", () => {
    expect(formatTime("2026-05-11T16:30:00")).toBe("16.30");
  });

  it("late evening 23:59", () => {
    expect(formatTime(new Date(2026, 4, 11, 23, 59))).toBe("23.59");
  });
});

describe("formatTimeRange", () => {
  it("kedua waktu present → 'HH.mm - HH.mm'", () => {
    expect(
      formatTimeRange(
        new Date(2026, 4, 11, 16, 0),
        new Date(2026, 4, 11, 18, 30)
      )
    ).toBe("16.00 - 18.30");
  });

  it("end null → cuma start time", () => {
    expect(formatTimeRange(new Date(2026, 4, 11, 16, 0), null)).toBe("16.00");
  });

  it("ISO string input untuk start dan end", () => {
    expect(
      formatTimeRange("2026-05-11T16:00:00", "2026-05-11T18:30:00")
    ).toBe("16.00 - 18.30");
  });
});

describe("formatDuration", () => {
  it("kurang dari 60 menit → 'X menit'", () => {
    expect(formatDuration(30)).toBe("30 menit");
  });

  it("59 menit edge", () => {
    expect(formatDuration(59)).toBe("59 menit");
  });

  it("60 menit → '1 jam'", () => {
    expect(formatDuration(60)).toBe("1 jam");
  });

  it("90 menit → '1,5 jam'", () => {
    expect(formatDuration(90)).toBe("1,5 jam");
  });

  it("120 menit → '2 jam'", () => {
    expect(formatDuration(120)).toBe("2 jam");
  });

  it("zero → '0 menit'", () => {
    expect(formatDuration(0)).toBe("0 menit");
  });
});

describe("winRate", () => {
  it("0 matches → 0% (no divide-by-zero)", () => {
    expect(winRate(0, 0)).toBe(0);
  });

  it("perfect (10/10) → 100", () => {
    expect(winRate(10, 10)).toBe(100);
  });

  it("half (5/10) → 50", () => {
    expect(winRate(5, 10)).toBe(50);
  });

  it("zero wins → 0", () => {
    expect(winRate(0, 20)).toBe(0);
  });

  it("rounding — 1/3 → 33", () => {
    expect(winRate(1, 3)).toBe(33);
  });

  it("rounding — 2/3 → 67", () => {
    expect(winRate(2, 3)).toBe(67);
  });
});

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves setelah ms milliseconds", async () => {
    let resolved = false;
    const promise = sleep(1000).then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(resolved).toBe(true);
  });

  it("zero ms resolves immediately", async () => {
    let resolved = false;
    const promise = sleep(0).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    await promise;
    expect(resolved).toBe(true);
  });
});
