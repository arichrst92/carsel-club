import { describe, expect, it } from "vitest";
import { computeTierProgress } from "@/lib/tier/progress";

describe("computeTierProgress", () => {
  it("fresh user (Rookie, 0 pts, 0 matches) → 0%", () => {
    const r = computeTierProgress(1, 0, 0);
    expect(r.currentTierName).toBe("Rookie");
    expect(r.nextTierName).toBe("Bronze");
    expect(r.fraction).toBe(0);
    expect(r.percent).toBe(0);
    expect(r.pointsToGo).toBe(50);
    expect(r.matchesToGo).toBe(10);
  });

  it("halfway in both dimensions → 50%", () => {
    // Bronze threshold: 50 pts, 10 matches; halfway = 25 pts + 5 matches
    const r = computeTierProgress(1, 25, 5);
    expect(r.percent).toBe(50);
  });

  it("lagging dimension caps progress", () => {
    // 50 pts (100% points) but 0 matches (0% matches) → fraction = 0
    const r = computeTierProgress(1, 50, 0);
    expect(r.percent).toBe(0);
  });

  it("just over threshold but still old tier → fraction=1", () => {
    // User barely promotes; if currentTierId still 1, math says 100%
    const r = computeTierProgress(1, 50, 10);
    expect(r.percent).toBe(100);
  });

  it("master tier (max) → 100% no next", () => {
    const r = computeTierProgress(6, 1500, 250);
    expect(r.nextTierName).toBeNull();
    expect(r.fraction).toBe(1);
    expect(r.percent).toBe(100);
    expect(r.pointsToGo).toBe(0);
    expect(r.matchesToGo).toBe(0);
  });

  it("clamps negative progress to 0", () => {
    const r = computeTierProgress(2, 0, 0); // user below Bronze min but tier=Bronze
    expect(r.percent).toBe(0);
  });

  it("unknown tier id falls back to Rookie", () => {
    const r = computeTierProgress(999, 0, 0);
    expect(r.currentTierName).toBe("Rookie");
  });

  it("Silver progress example", () => {
    // Silver=150pts/25matches, Gold=300pts/50matches
    // At 225 pts (50% of span) + 37 matches (47% of span) → 47%
    const r = computeTierProgress(3, 225, 37);
    expect(r.currentTierName).toBe("Silver");
    expect(r.nextTierName).toBe("Gold");
    expect(r.percent).toBeGreaterThan(40);
    expect(r.percent).toBeLessThan(55);
  });

  it("pointsToGo + matchesToGo accurate", () => {
    const r = computeTierProgress(2, 100, 20);
    // Next = Silver (150 pts, 25 matches)
    expect(r.pointsToGo).toBe(50);
    expect(r.matchesToGo).toBe(5);
  });
});
