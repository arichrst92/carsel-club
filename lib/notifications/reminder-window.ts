/**
 * Pure helpers untuk H-1 session reminder window (Sprint 28).
 *
 * Cron may run on irregular schedule (e.g., every 5-15 min). We need to
 * decide which sessions are eligible for reminder based on:
 * - scheduledAt in future (haven't started)
 * - within target window (e.g., 50-70 min ahead = ~H-1)
 * - reminderSentAt is null (idempotent)
 *
 * Returning explicit minutes-until from now lets us reuse this in
 * notification payload (inMinutes field).
 */

export type ReminderEligibility = {
  eligible: boolean;
  minutesUntil: number;
};

export type ReminderWindow = {
  /** lower bound minutes (inclusive) — earliest before start */
  minMinutes: number;
  /** upper bound minutes (exclusive) — latest before start */
  maxMinutes: number;
};

/**
 * Default H-1 window: between 50 and 75 minutes ahead.
 * Tolerates cron jitter, but doesn't fire too early.
 */
export const DEFAULT_REMINDER_WINDOW: ReminderWindow = {
  minMinutes: 50,
  maxMinutes: 75,
};

export function minutesBetween(now: Date, then: Date): number {
  return (then.getTime() - now.getTime()) / 60000;
}

export function isReminderEligible(
  now: Date,
  scheduledAt: Date,
  reminderSentAt: Date | null,
  window: ReminderWindow = DEFAULT_REMINDER_WINDOW
): ReminderEligibility {
  if (reminderSentAt !== null) {
    return { eligible: false, minutesUntil: 0 };
  }
  const minutesUntil = minutesBetween(now, scheduledAt);
  if (
    minutesUntil < window.minMinutes ||
    minutesUntil >= window.maxMinutes
  ) {
    return { eligible: false, minutesUntil };
  }
  return { eligible: true, minutesUntil };
}

/**
 * Rounded display: "60 menit" vs raw float.
 * 60 is the canonical H-1 display value.
 */
export function displayMinutes(minutesUntil: number): number {
  return Math.max(1, Math.round(minutesUntil));
}
