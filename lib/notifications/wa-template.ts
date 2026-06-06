/**
 * WhatsApp message templates per notification type (Sprint 28).
 *
 * Pure — testable. App URL passed in (not env-coupled).
 *
 * Style:
 * - Branded header *Carsel Club*
 * - Short body (WA messages cost per delivery + user reads on mobile)
 * - Action link at end (deep link → /sessions/<id> or /notifications)
 *
 * Refs:
 * - Used by: lib/notifications/generate.ts (WA dispatch branch)
 * - Trigger: createNotification when shouldDeliver(..., "wa")
 */

import type {
  NotificationType,
  NotificationPayloadByType,
} from "./types";

export type WaTemplateInput = {
  appUrl: string; // e.g. https://carsel.club (no trailing slash)
};

const BRAND = "*Carsel Club*";

function joinUrl(appUrl: string, path: string): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function fmtSessionInvite(
  p: NotificationPayloadByType["session_invite"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

🎾 *${p.inviterName}* mengundang kamu ke session:
*${p.sessionTitle}*

Buka: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}`)}`;
}

function fmtSessionReminder(
  p: NotificationPayloadByType["session_reminder"],
  ctx: WaTemplateInput
): string {
  const venueLine = p.venueName ? `📍 ${p.venueName}\n` : "";
  const when =
    p.inMinutes >= 60
      ? `${Math.round(p.inMinutes / 60)} jam lagi`
      : `${p.inMinutes} menit lagi`;
  return `${BRAND}

⏰ Session *${p.sessionTitle}* dimulai ${when}
${venueLine}
Detail: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}`)}`;
}

function fmtSessionCancelled(
  p: NotificationPayloadByType["session_cancelled"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

🚫 Session *${p.sessionTitle}* dibatalkan oleh host.

Cek detail: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}`)}`;
}

function fmtTierUp(
  p: NotificationPayloadByType["tier_up"]
): string {
  return `${BRAND}

🏆 Selamat! Tier kamu naik ke *${p.tierName}*

Keep grinding 💪`;
}

function fmtMatchResult(
  p: NotificationPayloadByType["match_result"],
  ctx: WaTemplateInput
): string {
  const outcomeLabel =
    p.outcome === "win" ? "🎉 Menang!" : p.outcome === "loss" ? "💪 Kalah" : "🤝 Draw";
  const pts = p.pointsEarned >= 0 ? `+${p.pointsEarned}` : `${p.pointsEarned}`;
  return `${BRAND}

${outcomeLabel} ${p.team1Score}–${p.team2Score} di *${p.sessionTitle}*
Poin: ${pts}

Detail: ${joinUrl(ctx.appUrl, `/matches/${p.matchId}`)}`;
}

function fmtFriendRequest(
  p: NotificationPayloadByType["friend_request"],
  ctx: WaTemplateInput
): string {
  const msg = p.message ? `\n\n"${p.message}"` : "";
  return `${BRAND}

👋 *${p.fromDisplayName}* kirim friend request${msg}

Review: ${joinUrl(ctx.appUrl, "/friends")}`;
}

function fmtFriendAccepted(
  p: NotificationPayloadByType["friend_accepted"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

🤝 *${p.byDisplayName}* sekarang jadi friend kamu

Lihat profil: ${joinUrl(ctx.appUrl, `/u/${p.byUserId}`)}`;
}

function fmtJoinRequested(
  p: NotificationPayloadByType["join_requested"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

✋ *${p.requesterDisplayName}* request gabung session *${p.sessionTitle}*

Review: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}/participants`)}`;
}

function fmtJoinApproved(
  p: NotificationPayloadByType["join_approved"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

✅ Request kamu ke *${p.sessionTitle}* di-approve!

Buka session: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}`)}`;
}

function fmtJoinRejected(
  p: NotificationPayloadByType["join_rejected"],
  ctx: WaTemplateInput
): string {
  return `${BRAND}

❌ Request kamu ke *${p.sessionTitle}* di-reject oleh host.

Lihat: ${joinUrl(ctx.appUrl, `/sessions/${p.sessionId}`)}`;
}

const TEMPLATES = {
  session_invite: fmtSessionInvite,
  session_reminder: fmtSessionReminder,
  session_cancelled: fmtSessionCancelled,
  tier_up: (p: NotificationPayloadByType["tier_up"], _ctx: WaTemplateInput) =>
    fmtTierUp(p),
  match_result: fmtMatchResult,
  friend_request: fmtFriendRequest,
  friend_accepted: fmtFriendAccepted,
  join_requested: fmtJoinRequested,
  join_approved: fmtJoinApproved,
  join_rejected: fmtJoinRejected,
} satisfies {
  [K in NotificationType]: (
    p: NotificationPayloadByType[K],
    ctx: WaTemplateInput
  ) => string;
};

export function buildWaMessage<T extends NotificationType>(
  type: T,
  payload: NotificationPayloadByType[T],
  ctx: WaTemplateInput
): string {
  const fn = TEMPLATES[type] as (
    p: NotificationPayloadByType[T],
    c: WaTemplateInput
  ) => string;
  return fn(payload, ctx);
}
