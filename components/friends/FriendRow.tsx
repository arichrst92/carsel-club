"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeFriendAction } from "@/app/actions/friends";
import { Toast } from "@/components/ui/Toast";

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

type Props = {
  friendId: string;
  displayName: string;
  city: string | null;
  totalPoints: number;
  totalMatches: number;
  tierName: string | null;
  avatarUrl?: string | null;
};

export function FriendRow(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initial = (props.displayName.trim()[0] ?? "?").toUpperCase();
  const tier = props.tierName ?? "Rookie";

  function handleRemove() {
    if (!confirm(`Remove ${props.displayName} from friends?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeFriendAction(props.friendId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
    <Toast message={error} onDismiss={() => setError(null)} />
    <div className="player-list-item">
      <Link
        href={`/u/${props.friendId}`}
        className="player-avatar-lg member-1"
        aria-label={`Profile ${props.displayName}`}
        style={
          props.avatarUrl
            ? {
                background: `url(${props.avatarUrl}) center/cover no-repeat`,
                color: "transparent",
                textDecoration: "none",
              }
            : {
                background: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
                textDecoration: "none",
              }
        }
      >
        {!props.avatarUrl && initial}
      </Link>
      <Link
        href={`/u/${props.friendId}`}
        className="player-info"
        style={{
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div className="player-name">
          <span>{props.displayName}</span>
        </div>
        <div className="player-meta-row">
          <span style={{ fontSize: 12, color: "var(--text-500)" }}>
            {TIER_EMOJI[tier]} {tier}
            {props.city && ` · 📍 ${props.city}`}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {props.totalPoints} pts · {props.totalMatches} matches
        </div>
      </Link>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        title="Remove friend"
        style={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--r-full)",
          background: "transparent",
          border: "none",
          fontSize: 14,
          cursor: "pointer",
          opacity: isPending ? 0.4 : 0.7,
        }}
      >
        🗑
      </button>
    </div>
    </>
  );
}
