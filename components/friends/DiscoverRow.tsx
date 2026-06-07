"use client";

import Link from "next/link";
import { useTransition } from "react";
import { sendFriendRequestAction } from "@/app/actions/friend-requests";
import type { DiscoverSuggestion } from "@/lib/db/queries/friend-discover";

export function DiscoverRow({ row }: { row: DiscoverSuggestion }) {
  const [pending, startTransition] = useTransition();

  function sendRequest() {
    startTransition(async () => {
      await sendFriendRequestAction(row.id);
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <Link
        href={`/u/${row.id}`}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: row.avatarUrl
            ? `url(${row.avatarUrl}) center/cover no-repeat`
            : "var(--primary-100)",
          color: "var(--primary-700)",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
          textDecoration: "none",
        }}
        aria-label={`Profile ${row.displayName}`}
      >
        {!row.avatarUrl &&
          (row.displayName.trim()[0] ?? "?").toUpperCase()}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/u/${row.id}`}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--text-900)",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.displayName}
        </Link>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {row.tierName ?? "Rookie"}
          {row.city && ` · ${row.city}`}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--primary-700)",
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          {row.mutualFriendCount > 0 &&
            `${row.mutualFriendCount} mutual${row.mutualFriendCount > 1 ? "s" : ""}`}
          {row.mutualFriendCount > 0 && row.coPlayerSessionCount > 0 && " · "}
          {row.coPlayerSessionCount > 0 &&
            `${row.coPlayerSessionCount} sessions together`}
        </div>
      </div>
      <button
        type="button"
        onClick={sendRequest}
        disabled={pending}
        className="btn-primary"
        style={{
          padding: "var(--s-2) var(--s-3)",
          fontSize: 12,
        }}
      >
        {pending ? "..." : "+ Add"}
      </button>
    </div>
  );
}
