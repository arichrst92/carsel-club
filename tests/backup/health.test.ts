import { describe, expect, it } from "vitest";
import {
  evaluateBackupHealth,
  statusLabel,
  statusColor,
  formatBackupAge,
  OK_HOURS_DEFAULT,
  STALE_HOURS_DEFAULT,
} from "@/lib/backup/health";

const now = new Date("2026-06-06T12:00:00Z");

describe("evaluateBackupHealth", () => {
  it("null lastBackupAt → never", () => {
    const r = evaluateBackupHealth(now, null);
    expect(r.status).toBe("never");
    expect(r.hoursSince).toBeNull();
    expect(r.lastBackupAt).toBeNull();
  });

  it("recent (1h ago) → ok", () => {
    const last = new Date("2026-06-06T11:00:00Z");
    const r = evaluateBackupHealth(now, last);
    expect(r.status).toBe("ok");
    expect(r.hoursSince).toBe(1);
  });

  it("at OK threshold (26h) → ok", () => {
    const last = new Date(now.getTime() - OK_HOURS_DEFAULT * 3_600_000);
    expect(evaluateBackupHealth(now, last).status).toBe("ok");
  });

  it("just past OK (27h) → stale", () => {
    const last = new Date(
      now.getTime() - (OK_HOURS_DEFAULT + 1) * 3_600_000
    );
    expect(evaluateBackupHealth(now, last).status).toBe("stale");
  });

  it("at STALE threshold (50h) → stale", () => {
    const last = new Date(
      now.getTime() - STALE_HOURS_DEFAULT * 3_600_000
    );
    expect(evaluateBackupHealth(now, last).status).toBe("stale");
  });

  it("past STALE (51h) → critical", () => {
    const last = new Date(
      now.getTime() - (STALE_HOURS_DEFAULT + 1) * 3_600_000
    );
    expect(evaluateBackupHealth(now, last).status).toBe("critical");
  });

  it("week old → critical", () => {
    const last = new Date(now.getTime() - 7 * 24 * 3_600_000);
    expect(evaluateBackupHealth(now, last).status).toBe("critical");
  });

  it("custom thresholds", () => {
    const last = new Date(now.getTime() - 6 * 3_600_000);
    expect(
      evaluateBackupHealth(now, last, { okHours: 12, staleHours: 24 }).status
    ).toBe("ok");
    expect(
      evaluateBackupHealth(now, last, { okHours: 3, staleHours: 12 }).status
    ).toBe("stale");
    expect(
      evaluateBackupHealth(now, last, { okHours: 1, staleHours: 3 }).status
    ).toBe("critical");
  });

  it("future backup time clamped to 0", () => {
    const last = new Date(now.getTime() + 3_600_000);
    const r = evaluateBackupHealth(now, last);
    expect(r.hoursSince).toBe(0);
    expect(r.status).toBe("ok");
  });
});

describe("statusLabel", () => {
  it("returns Indonesian labels", () => {
    expect(statusLabel("ok")).toBe("Sehat");
    expect(statusLabel("stale")).toBe("Terlambat");
    expect(statusLabel("critical")).toBe("Kritis");
    expect(statusLabel("never")).toBe("Belum pernah");
  });
});

describe("statusColor", () => {
  it("distinct color per status", () => {
    const ok = statusColor("ok");
    const stale = statusColor("stale");
    const crit = statusColor("critical");
    const never = statusColor("never");
    expect(new Set([ok, stale, crit, never]).size).toBe(4);
  });
});

describe("formatBackupAge", () => {
  it("null → dash", () => {
    expect(formatBackupAge(null)).toBe("—");
  });

  it("<1 hour", () => {
    expect(formatBackupAge(0)).toBe("<1 jam");
    expect(formatBackupAge(0.5)).toBe("<1 jam");
  });

  it("hours under 24", () => {
    expect(formatBackupAge(1)).toBe("1 jam");
    expect(formatBackupAge(12.4)).toBe("12 jam");
    expect(formatBackupAge(23.6)).toBe("24 jam");
  });

  it("days for ≥ 24h", () => {
    expect(formatBackupAge(24)).toBe("1 hari");
    expect(formatBackupAge(48)).toBe("2 hari");
    expect(formatBackupAge(72.5)).toBe("3 hari");
  });
});
