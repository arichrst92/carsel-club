/**
 * Build push payload dari notification (Sprint 27).
 *
 * Pure — depends only on FormattedNotification + type for tag.
 *
 * Tag strategy:
 * - Same type collapses notifications of same kind (e.g., multiple invites
 *   from same session merge instead of stacking)
 * - Per-notification ID would replace based on instance — we want type-level
 *   collapse for chattier types (match_result, friend_request) but
 *   per-item for unique events (tier_up, session_reminder)
 *
 * Per-type tag mode:
 * - "collapse" → same type replaces (tag=`cc-<type>`)
 * - "unique"   → each notification distinct (tag=`cc-<type>-<id>`)
 */

import type { FormattedNotification } from "@/lib/notifications/format";
import type { NotificationType } from "@/lib/notifications/types";
import type { PushNotificationPayload } from "./types";

const COLLAPSE_TYPES: Set<NotificationType> = new Set([
  "match_result",
  "friend_request",
  "join_requested",
]);

export function buildPushPayload(
  type: NotificationType,
  notificationId: string,
  fmt: FormattedNotification
): PushNotificationPayload {
  const tag = COLLAPSE_TYPES.has(type)
    ? `cc-${type}`
    : `cc-${type}-${notificationId}`;
  return {
    title: `${fmt.icon} ${fmt.title}`,
    body: fmt.body,
    url: fmt.href ?? "/notifications",
    tag,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    renotify: COLLAPSE_TYPES.has(type),
  };
}
