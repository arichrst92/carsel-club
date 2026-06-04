/**
 * Tests untuk lib/match/lifecycle.ts
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §2
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 4
 */

import { describe, it, expect } from "vitest";
import {
  canMatchTransition,
  transitionForMatchStart,
  transitionForMatchEnd,
  transitionForMatchRevert,
  canAdjustScore,
  nextAllowedMatchActions,
  MATCH_STATUS_LABEL,
  MATCH_STATUS_EMOJI,
  type MatchStatus,
} from "@/lib/match/lifecycle";

describe("labels & emoji", () => {
  it("STATUS_LABEL coverage", () => {
    expect(MATCH_STATUS_LABEL.pending).toBeTruthy();
    expect(MATCH_STATUS_LABEL.live).toBeTruthy();
    expect(MATCH_STATUS_LABEL.completed).toBeTruthy();
  });

  it("STATUS_EMOJI coverage", () => {
    expect(MATCH_STATUS_EMOJI.pending).toBeTruthy();
    expect(MATCH_STATUS_EMOJI.live).toBeTruthy();
    expect(MATCH_STATUS_EMOJI.completed).toBeTruthy();
  });
});

describe("canMatchTransition — same status", () => {
  it.each<MatchStatus>(["pending", "live", "completed"])(
    "'%s' → '%s' = false",
    (s) => {
      expect(canMatchTransition(s, s)).toBe(false);
    }
  );
});

describe("canMatchTransition — pending as source", () => {
  it("pending → live = true", () => {
    expect(canMatchTransition("pending", "live")).toBe(true);
  });
  it("pending → completed = true (skip live)", () => {
    expect(canMatchTransition("pending", "completed")).toBe(true);
  });
});

describe("canMatchTransition — live as source", () => {
  it("live → completed = true", () => {
    expect(canMatchTransition("live", "completed")).toBe(true);
  });
  it("live → pending = false (no backward)", () => {
    expect(canMatchTransition("live", "pending")).toBe(false);
  });
});

describe("canMatchTransition — completed as source (revert)", () => {
  it("completed → live = true (revert)", () => {
    expect(canMatchTransition("completed", "live")).toBe(true);
  });
  it("completed → pending = false", () => {
    expect(canMatchTransition("completed", "pending")).toBe(false);
  });
});

describe("transitionForMatchStart", () => {
  it("pending → live", () => {
    expect(transitionForMatchStart("pending")).toBe("live");
  });
  it("live throws (sudah live)", () => {
    expect(() => transitionForMatchStart("live")).toThrow(/pending/i);
  });
  it("completed throws", () => {
    expect(() => transitionForMatchStart("completed")).toThrow(/pending/i);
  });
});

describe("transitionForMatchEnd", () => {
  it("pending → completed (shortcut)", () => {
    expect(transitionForMatchEnd("pending")).toBe("completed");
  });
  it("live → completed", () => {
    expect(transitionForMatchEnd("live")).toBe("completed");
  });
  it("completed throws", () => {
    expect(() => transitionForMatchEnd("completed")).toThrow(/sudah/i);
  });
});

describe("transitionForMatchRevert", () => {
  it("completed → live", () => {
    expect(transitionForMatchRevert("completed")).toBe("live");
  });
  it("pending throws", () => {
    expect(() => transitionForMatchRevert("pending")).toThrow(/completed/i);
  });
  it("live throws", () => {
    expect(() => transitionForMatchRevert("live")).toThrow();
  });
});

describe("canAdjustScore — strict (only live)", () => {
  it("pending = false (must Start first)", () => {
    expect(canAdjustScore("pending")).toBe(false);
  });
  it("live = true", () => {
    expect(canAdjustScore("live")).toBe(true);
  });
  it("completed = false (use Edit instead)", () => {
    expect(canAdjustScore("completed")).toBe(false);
  });
});

describe("nextAllowedMatchActions", () => {
  it("pending → [start, end]", () => {
    expect(nextAllowedMatchActions("pending")).toEqual(["start", "end"]);
  });
  it("live → [end]", () => {
    expect(nextAllowedMatchActions("live")).toEqual(["end"]);
  });
  it("completed → [revert, edit]", () => {
    expect(nextAllowedMatchActions("completed")).toEqual(["revert", "edit"]);
  });
});
