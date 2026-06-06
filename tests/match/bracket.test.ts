import { describe, expect, it } from "vitest";
import {
  computeBracketSize,
  computeTotalRounds,
  matchesInRound,
  nextRoundSlot,
  sisterSlot,
  buildFirstRoundPairings,
  buildNextRoundPairing,
  bracketWinner,
  validateTeamCount,
  validateTeams,
  seedTeams,
  type Team,
} from "@/lib/match/bracket";

const t = (a: string, b: string): Team => [a, b];

describe("computeBracketSize", () => {
  it("zero or one → 2 (min)", () => {
    expect(computeBracketSize(0)).toBe(2);
    expect(computeBracketSize(1)).toBe(2);
  });

  it("exact powers of 2", () => {
    expect(computeBracketSize(2)).toBe(2);
    expect(computeBracketSize(4)).toBe(4);
    expect(computeBracketSize(8)).toBe(8);
    expect(computeBracketSize(16)).toBe(16);
  });

  it("rounds up to next power of 2", () => {
    expect(computeBracketSize(3)).toBe(4);
    expect(computeBracketSize(5)).toBe(8);
    expect(computeBracketSize(9)).toBe(16);
    expect(computeBracketSize(33)).toBe(64);
  });
});

describe("computeTotalRounds", () => {
  it("0/1 teams → 1 round (degenerate)", () => {
    expect(computeTotalRounds(0)).toBe(1);
    expect(computeTotalRounds(1)).toBe(1);
  });

  it("2 teams = 1 round", () => {
    expect(computeTotalRounds(2)).toBe(1);
  });

  it("4 teams = 2 rounds", () => {
    expect(computeTotalRounds(4)).toBe(2);
  });

  it("8 teams = 3 rounds", () => {
    expect(computeTotalRounds(8)).toBe(3);
  });

  it("non-power-of-2 rounds up", () => {
    expect(computeTotalRounds(5)).toBe(3); // bracket 8
    expect(computeTotalRounds(9)).toBe(4); // bracket 16
  });
});

describe("matchesInRound", () => {
  it("bracket 8 → round 1=4, 2=2, 3=1", () => {
    expect(matchesInRound(8, 1)).toBe(4);
    expect(matchesInRound(8, 2)).toBe(2);
    expect(matchesInRound(8, 3)).toBe(1);
  });

  it("bracket 4 → round 1=2, 2=1", () => {
    expect(matchesInRound(4, 1)).toBe(2);
    expect(matchesInRound(4, 2)).toBe(1);
  });

  it("round 0 or negative → 0", () => {
    expect(matchesInRound(8, 0)).toBe(0);
    expect(matchesInRound(8, -1)).toBe(0);
  });

  it("round beyond total → 0", () => {
    expect(matchesInRound(8, 4)).toBe(0);
  });
});

describe("nextRoundSlot + sisterSlot", () => {
  it("nextRoundSlot floor div 2", () => {
    expect(nextRoundSlot(0)).toBe(0);
    expect(nextRoundSlot(1)).toBe(0);
    expect(nextRoundSlot(2)).toBe(1);
    expect(nextRoundSlot(3)).toBe(1);
    expect(nextRoundSlot(7)).toBe(3);
  });

  it("sisterSlot xor 1", () => {
    expect(sisterSlot(0)).toBe(1);
    expect(sisterSlot(1)).toBe(0);
    expect(sisterSlot(2)).toBe(3);
    expect(sisterSlot(7)).toBe(6);
  });
});

describe("buildFirstRoundPairings", () => {
  it("exact 4 teams → 2 matches, no byes", () => {
    const teams = [t("a1", "a2"), t("b1", "b2"), t("c1", "c2"), t("d1", "d2")];
    const p = buildFirstRoundPairings(teams, 4);
    expect(p).toHaveLength(2);
    expect(p[0]).toMatchObject({
      slot: 0,
      team1: teams[0],
      team2: teams[1],
      isBye: false,
    });
    expect(p[1]).toMatchObject({
      slot: 1,
      team1: teams[2],
      team2: teams[3],
      isBye: false,
    });
  });

  it("3 teams → bracket 4 → last slot is bye", () => {
    const teams = [t("a1", "a2"), t("b1", "b2"), t("c1", "c2")];
    const p = buildFirstRoundPairings(teams, 4);
    expect(p).toHaveLength(2);
    expect(p[0].isBye).toBe(false);
    expect(p[1]).toMatchObject({
      slot: 1,
      team1: teams[2],
      team2: null,
      isBye: true,
    });
  });

  it("5 teams → bracket 8 → 4 matches, 3 byes", () => {
    const teams = Array.from({ length: 5 }, (_, i) =>
      t(`${i}a`, `${i}b`)
    );
    const p = buildFirstRoundPairings(teams, 8);
    expect(p).toHaveLength(4);
    expect(p[0].isBye).toBe(false);
    expect(p[1].isBye).toBe(false);
    expect(p[2].isBye).toBe(true); // teams[4] vs null
    expect(p[3].isBye).toBe(true); // null vs null
  });
});

describe("bracketWinner", () => {
  it("team1 score higher → team1 wins", () => {
    const a = t("a1", "a2");
    const b = t("b1", "b2");
    expect(bracketWinner(a, b, 21, 10)).toBe(a);
  });

  it("team2 wins", () => {
    const a = t("a1", "a2");
    const b = t("b1", "b2");
    expect(bracketWinner(a, b, 5, 21)).toBe(b);
  });

  it("draw → null", () => {
    const a = t("a1", "a2");
    const b = t("b1", "b2");
    expect(bracketWinner(a, b, 15, 15)).toBeNull();
  });
});

describe("buildNextRoundPairing", () => {
  it("both winners present → normal pairing", () => {
    const a = t("a1", "a2");
    const b = t("b1", "b2");
    const r = buildNextRoundPairing(0, a, b);
    expect(r).toMatchObject({ slot: 0, team1: a, team2: b, isBye: false });
  });

  it("left bye propagates → isBye true", () => {
    const b = t("b1", "b2");
    const r = buildNextRoundPairing(0, null, b);
    expect(r.isBye).toBe(true);
    expect(r.team1).toBeNull();
    expect(r.team2).toBe(b);
  });

  it("right bye", () => {
    const a = t("a1", "a2");
    const r = buildNextRoundPairing(1, a, null);
    expect(r.isBye).toBe(true);
  });

  it("both null (degenerate)", () => {
    const r = buildNextRoundPairing(0, null, null);
    expect(r.isBye).toBe(true);
  });
});

describe("validateTeamCount", () => {
  it("≥ 2 ok", () => {
    expect(validateTeamCount(2)).toBeNull();
    expect(validateTeamCount(64)).toBeNull();
  });

  it("< 2 rejected", () => {
    expect(validateTeamCount(0)).toContain("Minimal 2");
    expect(validateTeamCount(1)).toContain("Minimal 2");
  });

  it("> 64 rejected", () => {
    expect(validateTeamCount(65)).toContain("Maksimum");
  });
});

describe("validateTeams", () => {
  it("clean teams ok", () => {
    expect(validateTeams([t("a", "b"), t("c", "d")])).toBeNull();
  });

  it("duplicate within team rejected", () => {
    expect(validateTeams([t("a", "a")])).toContain("duplikat");
  });

  it("cross-team duplicate (first slot) rejected", () => {
    expect(validateTeams([t("a", "b"), t("a", "c")])).toContain("> 1 team");
  });

  it("cross-team duplicate (second slot) rejected", () => {
    expect(validateTeams([t("a", "b"), t("c", "a")])).toContain("> 1 team");
  });
});

describe("seedTeams", () => {
  it("by_join_order → identity (cloned)", () => {
    const teams = [t("a", "b"), t("c", "d")];
    const r = seedTeams(teams, "by_join_order");
    expect(r).toEqual(teams);
    expect(r).not.toBe(teams);
  });

  it("random with deterministic rand", () => {
    const teams = [t("a", "b"), t("c", "d"), t("e", "f"), t("g", "h")];
    // rand=0 means swap with index 0 each time → reverses with constraint
    let calls = 0;
    const rand = () => {
      calls++;
      return 0;
    };
    const r = seedTeams(teams, "random", rand);
    expect(r).toHaveLength(teams.length);
    expect(calls).toBeGreaterThan(0);
    // All input teams still present
    for (const t of teams) expect(r).toContainEqual(t);
  });

  it("random default Math.random — output is permutation", () => {
    const teams = Array.from({ length: 8 }, (_, i) => t(`${i}a`, `${i}b`));
    const r = seedTeams(teams, "random");
    expect(r).toHaveLength(8);
    for (const team of teams) expect(r).toContainEqual(team);
  });

  it("single team no-op", () => {
    const teams = [t("a", "b")];
    expect(seedTeams(teams, "random")).toEqual(teams);
  });
});
