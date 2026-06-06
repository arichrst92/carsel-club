"use client";

/**
 * Share top-10 card (Sprint 32) — generates Web Share with the OG image URL.
 */

import { useState } from "react";

export function LeaderboardShareButton(props: {
  scope: "global" | "regional";
  period: "all_time" | "monthly" | "weekly";
  city: string | null;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  function buildUrl(): string {
    const sp = new URLSearchParams();
    sp.set("scope", props.scope);
    sp.set("period", props.period);
    if (props.scope === "regional" && props.city) sp.set("city", props.city);
    return `${props.appUrl.replace(/\/+$/, "")}/leaderboard?${sp.toString()}`;
  }

  async function handleShare() {
    const url = buildUrl();
    const title = `Top 10 ${props.scope === "regional" && props.city ? props.city : "Indonesia"} — Carsel Club`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled, fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "var(--s-2) var(--s-3)",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        color: "var(--text-900)",
        display: "flex",
        alignItems: "center",
        gap: "var(--s-1)",
      }}
    >
      {copied ? "✓ Disalin" : "🔗 Share top 10"}
    </button>
  );
}
