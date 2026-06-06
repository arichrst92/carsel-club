import { describe, expect, it } from "vitest";
import {
  resolveDisplayFlags,
  sanitizeDisplayFlags,
  applyDisplayMask,
  DEFAULT_DISPLAY_FLAGS,
  DISPLAY_FLAG_LABELS,
} from "@/lib/privacy/display-flags";

describe("resolveDisplayFlags", () => {
  it("null/undefined/non-object → defaults", () => {
    expect(resolveDisplayFlags(null)).toEqual(DEFAULT_DISPLAY_FLAGS);
    expect(resolveDisplayFlags(undefined)).toEqual(DEFAULT_DISPLAY_FLAGS);
    expect(resolveDisplayFlags("x")).toEqual(DEFAULT_DISPLAY_FLAGS);
    expect(resolveDisplayFlags(123)).toEqual(DEFAULT_DISPLAY_FLAGS);
  });

  it("partial override merges with defaults", () => {
    expect(resolveDisplayFlags({ showCity: false })).toEqual({
      ...DEFAULT_DISPLAY_FLAGS,
      showCity: false,
    });
  });

  it("ignores unknown keys + non-boolean values", () => {
    expect(
      resolveDisplayFlags({
        showCity: "no",
        unknownKey: false,
        showStats: true,
      })
    ).toEqual({ ...DEFAULT_DISPLAY_FLAGS, showStats: true });
  });

  it("all flags off", () => {
    expect(
      resolveDisplayFlags({
        showCity: false,
        showStats: false,
        showAchievements: false,
        showMatches: false,
      })
    ).toEqual({
      showCity: false,
      showStats: false,
      showAchievements: false,
      showMatches: false,
    });
  });
});

describe("sanitizeDisplayFlags", () => {
  it("drops invalid input", () => {
    expect(sanitizeDisplayFlags(null)).toEqual({});
    expect(sanitizeDisplayFlags("x")).toEqual({});
  });

  it("keeps only known boolean keys", () => {
    expect(
      sanitizeDisplayFlags({
        showCity: false,
        bogus: true,
        showStats: "yes",
      })
    ).toEqual({ showCity: false });
  });

  it("empty object passes through", () => {
    expect(sanitizeDisplayFlags({})).toEqual({});
  });
});

describe("applyDisplayMask", () => {
  const baseProfile = {
    city: "Bandung",
    totalPoints: 100,
    totalMatches: 10,
    totalWins: 6,
    totalLosses: 3,
    totalDraws: 1,
  };

  it("isSelf → no mask", () => {
    const flags = { ...DEFAULT_DISPLAY_FLAGS, showCity: false };
    expect(applyDisplayMask(baseProfile, flags, true)).toEqual(baseProfile);
  });

  it("city masked when showCity=false", () => {
    const flags = { ...DEFAULT_DISPLAY_FLAGS, showCity: false };
    const r = applyDisplayMask(baseProfile, flags, false);
    expect(r.city).toBeNull();
    expect(r.totalPoints).toBe(100);
  });

  it("stats zeroed when showStats=false", () => {
    const flags = { ...DEFAULT_DISPLAY_FLAGS, showStats: false };
    const r = applyDisplayMask(baseProfile, flags, false);
    expect(r.totalPoints).toBe(0);
    expect(r.totalMatches).toBe(0);
    expect(r.totalWins).toBe(0);
    expect(r.totalLosses).toBe(0);
    expect(r.totalDraws).toBe(0);
    expect(r.city).toBe("Bandung");
  });

  it("both masks composable", () => {
    const flags = {
      ...DEFAULT_DISPLAY_FLAGS,
      showCity: false,
      showStats: false,
    };
    const r = applyDisplayMask(baseProfile, flags, false);
    expect(r.city).toBeNull();
    expect(r.totalPoints).toBe(0);
  });

  it("missing stats fields don't crash", () => {
    const minimal = { city: "Jakarta" };
    const flags = { ...DEFAULT_DISPLAY_FLAGS, showStats: false };
    const r = applyDisplayMask(minimal, flags, false);
    expect(r.city).toBe("Jakarta");
  });

  it("DISPLAY_FLAG_LABELS has all keys", () => {
    expect(Object.keys(DISPLAY_FLAG_LABELS)).toEqual(
      Object.keys(DEFAULT_DISPLAY_FLAGS)
    );
  });
});
