/**
 * Tests untuk lib/sessions/lifecycle.ts
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §1
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 3
 */

import { describe, it, expect } from "vitest";
import {
  canTransition,
  transitionForEnd,
  transitionForStart,
  transitionForCancel,
  transitionForReopen,
  nextAllowedActions,
  isSoftTerminal,
  isStatusReached,
  STATUS_LABEL,
  STATUS_EMOJI,
  STATUS_ORDER,
  type SessionStatus,
} from "@/lib/sessions/lifecycle";

describe("STATUS_ORDER + labels", () => {
  it("STATUS_ORDER coverage 4 status", () => {
    expect(STATUS_ORDER).toEqual([
      "upcoming",
      "live",
      "completed",
      "cancelled",
    ]);
  });

  it("STATUS_LABEL punya label untuk semua status", () => {
    for (const s of STATUS_ORDER) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });

  it("STATUS_EMOJI punya emoji untuk semua status", () => {
    for (const s of STATUS_ORDER) {
      expect(STATUS_EMOJI[s]).toBeTruthy();
    }
  });
});

describe("canTransition — same status = false", () => {
  it.each<SessionStatus>([
    "upcoming",
    "live",
    "completed",
    "cancelled",
  ])("identity transition '%s' → '%s' = false", (s) => {
    expect(canTransition(s, s)).toBe(false);
  });
});

describe("canTransition — upcoming as source", () => {
  it("upcoming → live = true", () => {
    expect(canTransition("upcoming", "live")).toBe(true);
  });
  it("upcoming → completed = true (End sebelum live)", () => {
    expect(canTransition("upcoming", "completed")).toBe(true);
  });
  it("upcoming → cancelled = true", () => {
    expect(canTransition("upcoming", "cancelled")).toBe(true);
  });
});

describe("canTransition — live as source", () => {
  it("live → completed = true", () => {
    expect(canTransition("live", "completed")).toBe(true);
  });
  it("live → cancelled = true", () => {
    expect(canTransition("live", "cancelled")).toBe(true);
  });
  it("live → upcoming = false", () => {
    expect(canTransition("live", "upcoming")).toBe(false);
  });
});

describe("canTransition — completed as source (reopen)", () => {
  it("completed → live = true (reopen w/ rounds)", () => {
    expect(canTransition("completed", "live")).toBe(true);
  });
  it("completed → upcoming = true (reopen w/o rounds)", () => {
    expect(canTransition("completed", "upcoming")).toBe(true);
  });
  it("completed → cancelled = false", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
  });
});

describe("canTransition — cancelled as source (reopen)", () => {
  it("cancelled → live = true", () => {
    expect(canTransition("cancelled", "live")).toBe(true);
  });
  it("cancelled → upcoming = true", () => {
    expect(canTransition("cancelled", "upcoming")).toBe(true);
  });
  it("cancelled → completed = false", () => {
    expect(canTransition("cancelled", "completed")).toBe(false);
  });
});

describe("transitionForEnd", () => {
  it("upcoming → completed", () => {
    expect(transitionForEnd("upcoming")).toBe("completed");
  });
  it("live → completed", () => {
    expect(transitionForEnd("live")).toBe("completed");
  });
  it("completed throws (already terminal)", () => {
    expect(() => transitionForEnd("completed")).toThrow(/sudah/i);
  });
  it("cancelled throws (already terminal)", () => {
    expect(() => transitionForEnd("cancelled")).toThrow(/sudah/i);
  });
});

describe("transitionForStart", () => {
  it("upcoming → live", () => {
    expect(transitionForStart("upcoming")).toBe("live");
  });
  it("live throws (sudah live)", () => {
    expect(() => transitionForStart("live")).toThrow(/upcoming/i);
  });
  it("completed throws", () => {
    expect(() => transitionForStart("completed")).toThrow();
  });
  it("cancelled throws", () => {
    expect(() => transitionForStart("cancelled")).toThrow();
  });
});

describe("transitionForCancel", () => {
  it("upcoming → cancelled", () => {
    expect(transitionForCancel("upcoming")).toBe("cancelled");
  });
  it("live → cancelled", () => {
    expect(transitionForCancel("live")).toBe("cancelled");
  });
  it("completed throws", () => {
    expect(() => transitionForCancel("completed")).toThrow();
  });
  it("cancelled throws", () => {
    expect(() => transitionForCancel("cancelled")).toThrow();
  });
});

describe("transitionForReopen", () => {
  it("completed + hasRounds → live", () => {
    expect(transitionForReopen("completed", true)).toBe("live");
  });
  it("completed + no rounds → upcoming", () => {
    expect(transitionForReopen("completed", false)).toBe("upcoming");
  });
  it("cancelled + hasRounds → live", () => {
    expect(transitionForReopen("cancelled", true)).toBe("live");
  });
  it("cancelled + no rounds → upcoming", () => {
    expect(transitionForReopen("cancelled", false)).toBe("upcoming");
  });
  it("upcoming throws (no need to reopen)", () => {
    expect(() => transitionForReopen("upcoming", true)).toThrow();
  });
  it("live throws", () => {
    expect(() => transitionForReopen("live", false)).toThrow();
  });
});

describe("nextAllowedActions", () => {
  it("upcoming → [start, end, cancel]", () => {
    expect(nextAllowedActions("upcoming")).toEqual([
      "start",
      "end",
      "cancel",
    ]);
  });
  it("live → [end, cancel]", () => {
    expect(nextAllowedActions("live")).toEqual(["end", "cancel"]);
  });
  it("completed → [reopen]", () => {
    expect(nextAllowedActions("completed")).toEqual(["reopen"]);
  });
  it("cancelled → [reopen]", () => {
    expect(nextAllowedActions("cancelled")).toEqual(["reopen"]);
  });
});

describe("isSoftTerminal", () => {
  it("completed = true", () => {
    expect(isSoftTerminal("completed")).toBe(true);
  });
  it("cancelled = true", () => {
    expect(isSoftTerminal("cancelled")).toBe(true);
  });
  it("upcoming = false", () => {
    expect(isSoftTerminal("upcoming")).toBe(false);
  });
  it("live = false", () => {
    expect(isSoftTerminal("live")).toBe(false);
  });
});

describe("isStatusReached — linear timeline", () => {
  it("current=upcoming → upcoming reached, lainnya tidak", () => {
    expect(isStatusReached("upcoming", "upcoming")).toBe(true);
    expect(isStatusReached("live", "upcoming")).toBe(false);
    expect(isStatusReached("completed", "upcoming")).toBe(false);
  });

  it("current=live → upcoming + live reached", () => {
    expect(isStatusReached("upcoming", "live")).toBe(true);
    expect(isStatusReached("live", "live")).toBe(true);
    expect(isStatusReached("completed", "live")).toBe(false);
  });

  it("current=completed → semua linear reached", () => {
    expect(isStatusReached("upcoming", "completed")).toBe(true);
    expect(isStatusReached("live", "completed")).toBe(true);
    expect(isStatusReached("completed", "completed")).toBe(true);
  });
});

describe("isStatusReached — cancelled (alternative branch)", () => {
  it("cancelled → upcoming + cancelled reached", () => {
    expect(isStatusReached("upcoming", "cancelled")).toBe(true);
    expect(isStatusReached("cancelled", "cancelled")).toBe(true);
  });

  it("cancelled → live + completed NOT reached (cancelled diverges)", () => {
    expect(isStatusReached("live", "cancelled")).toBe(false);
    expect(isStatusReached("completed", "cancelled")).toBe(false);
  });

  it("isStatusReached('cancelled', live) = false (linear path)", () => {
    expect(isStatusReached("cancelled", "live")).toBe(false);
  });
});
