/**
 * Notification bell with unread badge (Sprint 26).
 *
 * Server component — fetches unread count.
 */

import Link from "next/link";
import { countUnreadNotifications } from "@/lib/db/queries/notifications";

export async function NotificationBell({ userId }: { userId: string }) {
  const unread = await countUnreadNotifications(userId);
  const badgeText = unread === 0 ? null : unread > 99 ? "99+" : String(unread);
  return (
    <Link
      href="/notifications"
      className="icon-btn"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      style={{ position: "relative" }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {badgeText && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: "var(--danger-600, #dc2626)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            display: "grid",
            placeItems: "center",
            border: "2px solid var(--bg-base, #fff)",
            lineHeight: 1,
          }}
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
}
