/**
 * Notification preferences — pure helpers (Sprint 26).
 *
 * Settings stored sebagai JSONB per user. Default = all channels on.
 *
 * Channels:
 * - in_app: always shows di /notifications page
 * - push: web push (Sprint 27)
 * - wa: WhatsApp blast (Sprint 28)
 *
 * Quiet hours: range 0-23 hour. Can wrap midnight (start=22, end=7).
 * Null start/end = no quiet hours.
 *
 * Refs:
 * - Schema: user_notification_prefs
 * - Types: lib/notifications/types.ts
 */

import type { NotificationType } from "./types";

export type Channel = "in_app" | "push" | "wa";

export type ChannelPrefs = {
  in_app: boolean;
  push: boolean;
  wa: boolean;
};

export type NotificationSettings = Partial<
  Record<NotificationType, Partial<ChannelPrefs>>
>;

export const DEFAULT_CHANNELS: ChannelPrefs = {
  in_app: true,
  push: true,
  wa: false, // WA opt-in only
};

/**
 * Per-type channel override default — sebagian type lebih intrusive,
 * defaultnya beda.
 */
const PER_TYPE_DEFAULTS: Partial<Record<NotificationType, ChannelPrefs>> = {
  // Reminder defaults push + wa on (high-value)
  session_reminder: { in_app: true, push: true, wa: true },
  // Tier up high-celebration, all on
  tier_up: { in_app: true, push: true, wa: true },
  // Match result default WA off (noisy)
  match_result: { in_app: true, push: true, wa: false },
};

/**
 * Resolve effective channel prefs untuk satu type, applying defaults.
 */
export function resolveChannels(
  settings: NotificationSettings,
  type: NotificationType
): ChannelPrefs {
  const base = PER_TYPE_DEFAULTS[type] ?? DEFAULT_CHANNELS;
  const override = settings[type] ?? {};
  return {
    in_app: override.in_app ?? base.in_app,
    push: override.push ?? base.push,
    wa: override.wa ?? base.wa,
  };
}

/**
 * Check whether channel enabled untuk type.
 */
export function isChannelEnabled(
  settings: NotificationSettings,
  type: NotificationType,
  channel: Channel
): boolean {
  return resolveChannels(settings, type)[channel];
}

/**
 * Quiet hours check.
 * - null start/end → not in quiet hours
 * - start < end → simple range (e.g., 13-15 = 1-3pm)
 * - start > end → wraps midnight (e.g., 22-7 = 10pm-7am)
 * - start === end → entire day (rare edge)
 */
export function isQuietHours(
  hour: number,
  start: number | null,
  end: number | null
): boolean {
  if (start === null || end === null) return false;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;
  if (start === end) return true;
  if (start < end) {
    return hour >= start && hour < end;
  }
  // Wraps midnight
  return hour >= start || hour < end;
}

/**
 * Should we deliver this push/wa notification right now?
 * - in_app channel: never gated (always store)
 * - other channels: gated by both pref + quiet hours
 */
export function shouldDeliver(
  settings: NotificationSettings,
  type: NotificationType,
  channel: Channel,
  currentHour: number,
  quietStart: number | null,
  quietEnd: number | null
): boolean {
  if (channel === "in_app") return true;
  if (!isChannelEnabled(settings, type, channel)) return false;
  if (isQuietHours(currentHour, quietStart, quietEnd)) return false;
  return true;
}
