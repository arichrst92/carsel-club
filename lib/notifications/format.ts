/**
 * Pure formatters for notification rendering (Sprint 25).
 *
 * Sprint 26 UI akan pakai ini untuk render title/body/href tanpa fetch
 * tambahan — semua info ada di payload.
 *
 * Refs:
 * - Types: lib/notifications/types.ts
 * - Used by: components/notifications/* (Sprint 26)
 */

import type {
  NotificationType,
  NotificationPayloadByType,
} from "./types";

export type FormattedNotification = {
  icon: string; // emoji or short token
  title: string;
  body: string;
  href: string | null;
};

function fmtSessionInvite(
  p: NotificationPayloadByType["session_invite"]
): FormattedNotification {
  return {
    icon: "📅",
    title: "Diundang ke session",
    body: `${p.inviterName} mengundang kamu ke ${p.sessionTitle}`,
    href: `/sessions/${p.sessionId}`,
  };
}

function fmtSessionReminder(
  p: NotificationPayloadByType["session_reminder"]
): FormattedNotification {
  const venue = p.venueName ? ` di ${p.venueName}` : "";
  const when =
    p.inMinutes >= 60
      ? `${Math.round(p.inMinutes / 60)} jam lagi`
      : `${p.inMinutes} menit lagi`;
  return {
    icon: "⏰",
    title: "Session sebentar lagi",
    body: `${p.sessionTitle}${venue} • ${when}`,
    href: `/sessions/${p.sessionId}`,
  };
}

function fmtSessionCancelled(
  p: NotificationPayloadByType["session_cancelled"]
): FormattedNotification {
  return {
    icon: "🚫",
    title: "Session dibatalkan",
    body: `${p.sessionTitle} di-cancel oleh host`,
    href: `/sessions/${p.sessionId}`,
  };
}

function fmtTierUp(
  p: NotificationPayloadByType["tier_up"]
): FormattedNotification {
  return {
    icon: "🏆",
    title: "Tier naik!",
    body: `Selamat — kamu sekarang ${p.tierName}`,
    href: "/profile",
  };
}

function fmtMatchResult(
  p: NotificationPayloadByType["match_result"]
): FormattedNotification {
  const outcomeLabel =
    p.outcome === "win" ? "Menang" : p.outcome === "loss" ? "Kalah" : "Draw";
  const pts = p.pointsEarned >= 0 ? `+${p.pointsEarned}` : `${p.pointsEarned}`;
  return {
    icon: p.outcome === "win" ? "🎉" : p.outcome === "draw" ? "🤝" : "💪",
    title: `${outcomeLabel} ${p.team1Score}–${p.team2Score}`,
    body: `${p.sessionTitle} • ${pts} poin`,
    href: `/matches/${p.matchId}`,
  };
}

function fmtFriendRequest(
  p: NotificationPayloadByType["friend_request"]
): FormattedNotification {
  return {
    icon: "👋",
    title: "Friend request baru",
    body: p.message
      ? `${p.fromDisplayName}: "${p.message}"`
      : `${p.fromDisplayName} ingin jadi friend`,
    href: "/friends",
  };
}

function fmtFriendAccepted(
  p: NotificationPayloadByType["friend_accepted"]
): FormattedNotification {
  return {
    icon: "🤝",
    title: "Friend request di-accept",
    body: `${p.byDisplayName} dan kamu sekarang friends`,
    href: `/u/${p.byUserId}`,
  };
}

function fmtJoinRequested(
  p: NotificationPayloadByType["join_requested"]
): FormattedNotification {
  return {
    icon: "✋",
    title: "Join request baru",
    body: `${p.requesterDisplayName} mau gabung ke ${p.sessionTitle}`,
    href: `/sessions/${p.sessionId}/participants`,
  };
}

function fmtJoinApproved(
  p: NotificationPayloadByType["join_approved"]
): FormattedNotification {
  return {
    icon: "✅",
    title: "Join request di-approve",
    body: `Kamu sekarang gabung ${p.sessionTitle}`,
    href: `/sessions/${p.sessionId}`,
  };
}

function fmtJoinRejected(
  p: NotificationPayloadByType["join_rejected"]
): FormattedNotification {
  return {
    icon: "❌",
    title: "Join request di-reject",
    body: `Request kamu ke ${p.sessionTitle} ditolak`,
    href: `/sessions/${p.sessionId}`,
  };
}

const FORMATTERS = {
  session_invite: fmtSessionInvite,
  session_reminder: fmtSessionReminder,
  session_cancelled: fmtSessionCancelled,
  tier_up: fmtTierUp,
  match_result: fmtMatchResult,
  friend_request: fmtFriendRequest,
  friend_accepted: fmtFriendAccepted,
  join_requested: fmtJoinRequested,
  join_approved: fmtJoinApproved,
  join_rejected: fmtJoinRejected,
} as const;

/**
 * Format any notification → display-ready strings.
 *
 * Type guard pattern: kita pakai NotificationPayloadByType[T] cast karena
 * payload disimpan JSONB dan TS tidak bisa narrow dari runtime string.
 */
export function formatNotification(
  type: NotificationType,
  payload: Record<string, unknown>
): FormattedNotification {
  const fn = FORMATTERS[type] as (
    p: Record<string, unknown>
  ) => FormattedNotification;
  return fn(payload);
}

/**
 * Relative time label (no DateFormat overhead) — "5m", "2j", "3h".
 * Pure: depends only on inputs.
 */
export function formatRelativeTime(now: Date, then: Date): string {
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "baru";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "baru";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}j`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}h`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week}mg`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}bl`;
  const year = Math.floor(day / 365);
  return `${year}th`;
}
