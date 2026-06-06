"use client";

/**
 * NotificationItem — one row in notification list (Sprint 26).
 *
 * Tap behavior:
 * - If unread → fire markRead action + navigate
 * - If read → just navigate
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatNotification, formatRelativeTime } from "@/lib/notifications/format";
import type { NotificationType } from "@/lib/notifications/types";
import { markNotificationReadAction } from "@/app/actions/notifications";

export type NotificationItemProps = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
  now: Date;
};

export function NotificationItem(props: NotificationItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fmt = formatNotification(props.type, props.payload);
  const time = formatRelativeTime(props.now, props.createdAt);
  const isUnread = props.readAt === null;

  function handleClick() {
    startTransition(async () => {
      if (isUnread) {
        await markNotificationReadAction(props.id);
      }
      if (fmt.href) router.push(fmt.href);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="notif-item"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        background: isUnread ? "var(--primary-50)" : "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        opacity: pending ? 0.6 : 1,
        position: "relative",
      }}
    >
      {isUnread && (
        <span
          aria-label="unread"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--primary-600)",
          }}
        />
      )}
      <div
        style={{
          fontSize: 22,
          lineHeight: 1,
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          background: "var(--bg-soft)",
          borderRadius: "var(--r-md)",
          flexShrink: 0,
        }}
      >
        {fmt.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-900)",
            marginBottom: 2,
          }}
        >
          {fmt.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-700)",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {fmt.body}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {time}
        </div>
      </div>
    </button>
  );
}
