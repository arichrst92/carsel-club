"use server";

/**
 * Notification actions (Sprint 26).
 *
 * - Mark single notification read (idempotent)
 * - Mark all read
 * - Update preferences (settings + quiet hours)
 *
 * Refs:
 * - DB: notifications, user_notification_prefs
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 26
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications, userNotificationPrefs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type {
  NotificationSettings,
  ChannelPrefs,
} from "@/lib/notifications/prefs";
import type { NotificationType } from "@/lib/notifications/types";

export type ActionState = { error?: string; success?: string } | null;

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, me.id),
          isNull(notifications.readAt)
        )
      );
  } catch (e) {
    console.error("[markNotificationReadAction]", e);
    return { error: "Failed to mark as read" };
  }

  revalidatePath("/notifications");
  revalidatePath("/home");
  return null;
}

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, me.id),
          isNull(notifications.readAt)
        )
      );
  } catch (e) {
    console.error("[markAllNotificationsReadAction]", e);
    return { error: "Failed to mark all as read" };
  }

  revalidatePath("/notifications");
  revalidatePath("/home");
  return { success: "All marked as read" };
}

// ============================================================
// Preferences
// ============================================================

const VALID_TYPES: NotificationType[] = [
  "session_invite",
  "session_reminder",
  "session_cancelled",
  "friend_request",
  "friend_accepted",
  "join_requested",
  "join_approved",
  "join_rejected",
];

function sanitizeSettings(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== "object") return {};
  const out: NotificationSettings = {};
  for (const t of VALID_TYPES) {
    const v = (raw as Record<string, unknown>)[t];
    if (!v || typeof v !== "object") continue;
    const channels: Partial<ChannelPrefs> = {};
    const vv = v as Record<string, unknown>;
    if (typeof vv.in_app === "boolean") channels.in_app = vv.in_app;
    if (typeof vv.push === "boolean") channels.push = vv.push;
    if (typeof vv.wa === "boolean") channels.wa = vv.wa;
    if (Object.keys(channels).length > 0) out[t] = channels;
  }
  return out;
}

function sanitizeHour(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const s = String(value).trim();
  if (s === "" || s === "null") return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isInteger(n) || n < 0 || n > 23) return null;
  return n;
}

export async function updateNotificationPrefsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // Settings: parsed dari per-row toggles formData.
  // Field naming: pref.<type>.<channel> = "1" if enabled, else absent.
  const settings: NotificationSettings = {};
  for (const t of VALID_TYPES) {
    const channels: Partial<ChannelPrefs> = {
      in_app: formData.get(`pref.${t}.in_app`) === "1",
      push: formData.get(`pref.${t}.push`) === "1",
      wa: formData.get(`pref.${t}.wa`) === "1",
    };
    settings[t] = channels;
  }
  // Re-sanitize (defense vs malformed input)
  const cleanSettings = sanitizeSettings(settings);

  const quietStartHour = sanitizeHour(formData.get("quiet_start"));
  const quietEndHour = sanitizeHour(formData.get("quiet_end"));

  try {
    await db
      .insert(userNotificationPrefs)
      .values({
        userId: me.id,
        settings: cleanSettings,
        quietStartHour,
        quietEndHour,
      })
      .onConflictDoUpdate({
        target: userNotificationPrefs.userId,
        set: {
          settings: cleanSettings,
          quietStartHour,
          quietEndHour,
          updatedAt: sql`now()`,
        },
      });
  } catch (e) {
    console.error("[updateNotificationPrefsAction]", e);
    return { error: "Failed to save preferences. Try again." };
  }

  revalidatePath("/profile/settings/notifications");
  return { success: "Preferences saved" };
}
