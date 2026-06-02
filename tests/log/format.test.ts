/**
 * Tests untuk lib/log/format.ts
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import { describe, it, expect } from "vitest";
import {
  LEVEL_COLORS,
  LEVEL_BG,
  LEVEL_LABEL,
  TYPE_LABEL,
  LEVEL_SEVERITY,
  meetsSeverity,
  formatTimeOnly,
  formatRelative,
} from "@/lib/log/format";

describe("LEVEL_COLORS", () => {
  it("punya entry untuk semua 4 level", () => {
    expect(LEVEL_COLORS.info).toBeTruthy();
    expect(LEVEL_COLORS.warn).toBeTruthy();
    expect(LEVEL_COLORS.error).toBeTruthy();
    expect(LEVEL_COLORS.fatal).toBeTruthy();
  });

  it("colors adalah hex string", () => {
    for (const c of Object.values(LEVEL_COLORS)) {
      expect(c).toMatch(/^#[0-9A-Fa-f]+$/);
    }
  });
});

describe("LEVEL_BG", () => {
  it("punya entry untuk semua 4 level", () => {
    expect(LEVEL_BG.info).toBeTruthy();
    expect(LEVEL_BG.warn).toBeTruthy();
    expect(LEVEL_BG.error).toBeTruthy();
    expect(LEVEL_BG.fatal).toBeTruthy();
  });
});

describe("LEVEL_LABEL", () => {
  it("UPPERCASE labels", () => {
    expect(LEVEL_LABEL.info).toBe("INFO");
    expect(LEVEL_LABEL.warn).toBe("WARN");
    expect(LEVEL_LABEL.error).toBe("ERROR");
    expect(LEVEL_LABEL.fatal).toBe("FATAL");
  });
});

describe("TYPE_LABEL", () => {
  it("Title Case labels", () => {
    expect(TYPE_LABEL.log).toBe("Log");
    expect(TYPE_LABEL.event).toBe("Event");
  });
});

describe("LEVEL_SEVERITY", () => {
  it("info < warn < error < fatal", () => {
    expect(LEVEL_SEVERITY.info).toBeLessThan(LEVEL_SEVERITY.warn);
    expect(LEVEL_SEVERITY.warn).toBeLessThan(LEVEL_SEVERITY.error);
    expect(LEVEL_SEVERITY.error).toBeLessThan(LEVEL_SEVERITY.fatal);
  });
});

describe("meetsSeverity", () => {
  it("same level meets threshold", () => {
    expect(meetsSeverity("info", "info")).toBe(true);
    expect(meetsSeverity("warn", "warn")).toBe(true);
  });

  it("higher level meets lower threshold", () => {
    expect(meetsSeverity("error", "warn")).toBe(true);
    expect(meetsSeverity("fatal", "info")).toBe(true);
  });

  it("lower level fails higher threshold", () => {
    expect(meetsSeverity("info", "warn")).toBe(false);
    expect(meetsSeverity("warn", "error")).toBe(false);
    expect(meetsSeverity("error", "fatal")).toBe(false);
  });
});

describe("formatTimeOnly", () => {
  it("format Date ke HH:MM:SS", () => {
    const d = new Date(2026, 4, 11, 14, 30, 45);
    expect(formatTimeOnly(d)).toBe("14:30:45");
  });

  it("pad with zeros", () => {
    const d = new Date(2026, 4, 11, 5, 7, 9);
    expect(formatTimeOnly(d)).toBe("05:07:09");
  });

  it("ISO string input", () => {
    expect(formatTimeOnly("2026-05-11T14:30:45")).toBe("14:30:45");
  });

  it("midnight", () => {
    const d = new Date(2026, 4, 11, 0, 0, 0);
    expect(formatTimeOnly(d)).toBe("00:00:00");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-06-02T12:00:00.000Z");

  it("'baru saja' untuk < 10 detik", () => {
    const d = new Date(now.getTime() - 5_000);
    expect(formatRelative(d, now)).toBe("baru saja");
  });

  it("detik (<60)", () => {
    const d = new Date(now.getTime() - 30_000);
    expect(formatRelative(d, now)).toBe("30 detik lalu");
  });

  it("menit (<60)", () => {
    const d = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelative(d, now)).toBe("5 menit lalu");
  });

  it("jam (<24)", () => {
    const d = new Date(now.getTime() - 2 * 60 * 60_000);
    expect(formatRelative(d, now)).toBe("2 jam lalu");
  });

  it("kemarin (1 hari)", () => {
    const d = new Date(now.getTime() - 24 * 60 * 60_000);
    expect(formatRelative(d, now)).toBe("kemarin");
  });

  it("multi-day (<7)", () => {
    const d = new Date(now.getTime() - 3 * 24 * 60 * 60_000);
    expect(formatRelative(d, now)).toBe("3 hari lalu");
  });

  it(">7 hari → tanggal short", () => {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    const formatted = formatRelative(d, now);
    expect(formatted).toMatch(/\d+ [A-Z][a-z]+/);
  });

  it("ISO string input works", () => {
    const isoStr = new Date(now.getTime() - 60_000).toISOString();
    expect(formatRelative(isoStr, now)).toBe("1 menit lalu");
  });

  it("default `now` (no second arg) → uses real Date.now", () => {
    // Sanity check: tidak throw, returns string
    expect(typeof formatRelative(new Date(Date.now() - 1000))).toBe("string");
  });
});
