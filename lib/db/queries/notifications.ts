/**
 * Notifications queries (Sprint 25).
 */

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications, userNotificationPrefs } from "@/lib/db/schema";
import type {
  NotificationType,
  NotificationPayloadByType,
} from "@/lib/notifications/types";
import type { NotificationSettings } from "@/lib/notifications/prefs";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<NotificationRow[]> {
  const limit = Math.min(options.limit ?? 50, 200);
  const conditions = [eq(notifications.userId, userId)];
  if (options.unreadOnly) {
    conditions.push(isNull(notifications.readAt));
  }
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    payload: (r.payload ?? {}) as Record<string, unknown>,
  }));
}

export async function countUnreadNotifications(
  userId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    );
  return row?.value ?? 0;
}

/**
 * Get typed payload — narrows by NotificationType.
 */
export function typedPayload<T extends NotificationType>(
  row: NotificationRow,
  expected: T
): NotificationPayloadByType[T] | null {
  if (row.type !== expected) return null;
  return row.payload as NotificationPayloadByType[T];
}

// ============================================================
// Notification prefs (Sprint 26)
// ============================================================

export type NotificationPrefsRow = {
  settings: NotificationSettings;
  quietStartHour: number | null;
  quietEndHour: number | null;
};

export async function getNotificationPrefs(
  userId: string
): Promise<NotificationPrefsRow> {
  const [row] = await db
    .select({
      settings: userNotificationPrefs.settings,
      quietStartHour: userNotificationPrefs.quietStartHour,
      quietEndHour: userNotificationPrefs.quietEndHour,
    })
    .from(userNotificationPrefs)
    .where(eq(userNotificationPrefs.userId, userId))
    .limit(1);
  if (!row) {
    return { settings: {}, quietStartHour: null, quietEndHour: null };
  }
  return {
    settings: (row.settings ?? {}) as NotificationSettings,
    quietStartHour: row.quietStartHour,
    quietEndHour: row.quietEndHour,
  };
}
