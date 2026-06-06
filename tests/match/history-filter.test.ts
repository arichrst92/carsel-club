import { describe, expect, it } from "vitest";
import {
  parseHistoryFilter,
  applyHistoryFilter,
  HISTORY_FILTER_LABELS,
  VALID_HISTORY_FILTERS,
} from "@/lib/match/history-filter";

const sample = [
  { outcome: "win" as const, id: 1 },
  { outcome: "loss" as const, id: 2 },
  { outcome: "win" as const, id: 3 },
  { outcome: "draw" as const, id: 4 },
];

describe("parseHistoryFilter", () => {
  it("undefined → all", () => {
    expect(parseHistoryFilter(undefined)).toBe("all");
  });

  it("empty string → all", () => {
    expect(parseHistoryFilter("")).toBe("all");
  });

  it("known values pass through", () => {
    expect(parseHistoryFilter("win")).toBe("win");
    expect(parseHistoryFilter("loss")).toBe("loss");
    expect(parseHistoryFilter("draw")).toBe("draw");
    expect(parseHistoryFilter("all")).toBe("all");
  });

  it("unknown → all", () => {
    expect(parseHistoryFilter("xyz")).toBe("all");
    expect(parseHistoryFilter("WIN")).toBe("all"); // case-sensitive
  });
});

describe("applyHistoryFilter", () => {
  it("all → no filter", () => {
    expect(applyHistoryFilter(sample, "all")).toEqual(sample);
  });

  it("win", () => {
    const r = applyHistoryFilter(sample, "win");
    expect(r).toHaveLength(2);
    expect(r.every((m) => m.outcome === "win")).toBe(true);
  });

  it("loss", () => {
    const r = applyHistoryFilter(sample, "loss");
    expect(r).toHaveLength(1);
  });

  it("draw", () => {
    const r = applyHistoryFilter(sample, "draw");
    expect(r).toHaveLength(1);
  });

  it("empty list", () => {
    expect(applyHistoryFilter([], "win")).toEqual([]);
  });
});

describe("LABELS + VALID", () => {
  it("labels cover all valid filters", () => {
    for (const f of VALID_HISTORY_FILTERS) {
      expect(HISTORY_FILTER_LABELS[f]).toBeTruthy();
    }
  });

  it("4 valid filters", () => {
    expect(VALID_HISTORY_FILTERS).toHaveLength(4);
  });
});
