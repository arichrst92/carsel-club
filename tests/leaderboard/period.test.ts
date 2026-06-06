import { describe, expect, it } from "vitest";
import {
  periodSinceDate,
  periodLabel,
} from "@/lib/leaderboard/period";

const now = new Date("2026-06-06T12:00:00Z");

describe("periodSinceDate", () => {
  it("all_time → null", () => {
    expect(periodSinceDate(now, "all_time")).toBeNull();
  });

  it("weekly = now - 7d", () => {
    const r = periodSinceDate(now, "weekly")!;
    const expected = new Date(now.getTime());
    expected.setDate(expected.getDate() - 7);
    expect(r.getTime()).toBe(expected.getTime());
  });

  it("monthly = now - 30d", () => {
    const r = periodSinceDate(now, "monthly")!;
    const expected = new Date(now.getTime());
    expected.setDate(expected.getDate() - 30);
    expect(r.getTime()).toBe(expected.getTime());
  });

  it("does not mutate now input", () => {
    const orig = now.getTime();
    periodSinceDate(now, "weekly");
    expect(now.getTime()).toBe(orig);
  });
});

describe("periodLabel", () => {
  it("returns expected labels", () => {
    expect(periodLabel("all_time")).toBe("Sepanjang masa");
    expect(periodLabel("monthly")).toBe("30 hari terakhir");
    expect(periodLabel("weekly")).toBe("7 hari terakhir");
  });
});
