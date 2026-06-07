"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  cancelOutgoingRequestAction,
} from "@/app/actions/friend-requests";
import type { FriendRequestRow } from "@/lib/db/queries/friend-requests";
import { Toast } from "@/components/ui/Toast";

type Props = {
  row: FriendRequestRow;
  direction: "incoming" | "outgoing";
};

export function FriendRequestRowItem({ row, direction }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initial = (row.displayName.trim()[0] ?? "?").toUpperCase();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptFriendRequestAction(row.id);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleReject() {
    if (!confirm(`Reject request from ${row.displayName}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectFriendRequestAction(row.id);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm(`Cancel request to ${row.displayName}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelOutgoingRequestAction(row.id);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "var(--s-3)",
          background: "var(--bg)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--r-md)",
        }}
      >
        <Link
          href={`/u/${row.otherUserId}`}
          aria-label={`Profile ${row.displayName}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: row.avatarUrl
              ? `url(${row.avatarUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${row.tierColor ?? "var(--primary)"}, ${row.tierColor ?? "var(--primary-700)"})`,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          {!row.avatarUrl && initial}
        </Link>
        <Link
          href={`/u/${row.otherUserId}`}
          style={{
            flex: 1,
            minWidth: 0,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--text-900)",
            }}
          >
            {row.displayName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 600,
            }}
          >
            {row.tierName ?? "—"} · {row.totalPoints} pts
            {row.city && ` · 📍 ${row.city}`}
          </div>
          {row.message && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-700)",
                fontWeight: 600,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              &ldquo;{row.message}&rdquo;
            </div>
          )}
        </Link>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {direction === "incoming" ? (
            <>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isPending}
                style={{
                  padding: "6px 12px",
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--r-full)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                ✓ Accept
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  color: "var(--accent-600)",
                  border: "1px solid var(--accent-100)",
                  borderRadius: "var(--r-full)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              style={{
                padding: "6px 12px",
                background: "transparent",
                color: "var(--text-500)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
}
