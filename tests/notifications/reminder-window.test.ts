import { describe, expect, it } from "vitest";
import {
  isReminderEligible,
  minutesBetween,
  displayMinutes,
  DEFAULT_REMINDER_WINDOW,
} from "@/lib/notifications/reminder-window";

const now = new Date("2026-06-06T12:00:00Z");

describe("minutesBetween", () => {
  it("positive future", () => {
    expect(minutesBetween(now, new Date("2026-06-06T13:00:00Z"))).toBe(60);
  });

  it("zero", () => {
    expect(minutesBetween(now, now)).toBe(0);
  });

  it("negative past", () => {
    expect(minutesBetween(now, new Date("2026-06-06T11:30:00Z"))).toBe(-30);
  });

  it("sub-minute fraction", () => {
    expect(minutesBetween(now, new Date("2026-06-06T12:00:30Z"))).toBe(0.5);
  });
});

describe("isReminderEligible", () => {
  it("default window matches DEFAULT_REMINDER_WINDOW", () => {
    expect(DEFAULT_REMINDER_WINDOW.minMinutes).toBe(50);
    expect(DEFAULT_REMINDER_WINDOW.maxMinutes).toBe(75);
  });

  it("reminderSentAt set → not eligible", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T13:00:00Z"),
      new Date("2026-06-06T11:00:00Z")
    );
    expect(r.eligible).toBe(false);
    expect(r.minutesUntil).toBe(0);
  });

  it("60 min ahead, never sent → eligible", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T13:00:00Z"),
      null
    );
    expect(r.eligible).toBe(true);
    expect(r.minutesUntil).toBe(60);
  });

  it("min boundary inclusive (50 min)", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T12:50:00Z"),
      null
    );
    expect(r.eligible).toBe(true);
  });

  it("max boundary exclusive (75 min)", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T13:15:00Z"),
      null
    );
    expect(r.eligible).toBe(false);
  });

  it("too soon (under 50 min)", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T12:30:00Z"),
      null
    );
    expect(r.eligible).toBe(false);
    expect(r.minutesUntil).toBe(30);
  });

  it("too far (over 75 min)", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T14:00:00Z"),
      null
    );
    expect(r.eligible).toBe(false);
  });

  it("past scheduled (negative) → not eligible", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T11:30:00Z"),
      null
    );
    expect(r.eligible).toBe(false);
  });

  it("custom window", () => {
    const r = isReminderEligible(
      now,
      new Date("2026-06-06T12:10:00Z"),
      null,
      { minMinutes: 5, maxMinutes: 20 }
    );
    expect(r.eligible).toBe(true);
  });
});

describe("displayMinutes", () => {
  it("rounds float", () => {
    expect(displayMinutes(59.6)).toBe(60);
    expect(displayMinutes(60.4)).toBe(60);
  });

  it("clamps to min 1", () => {
    expect(displayMinutes(0)).toBe(1);
    expect(displayMinutes(0.3)).toBe(1);
    expect(displayMinutes(-5)).toBe(1);
  });
});
