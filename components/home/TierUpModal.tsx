"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissTierUpAction } from "@/app/actions/tier-up";

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

type Props = {
  userId: string;
  displayName: string;
  newTierId: number;
  newTierName: string;
  newTierColor: string | null;
  totalPoints: number;
  totalMatches: number;
};

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export function TierUpModal({
  userId,
  displayName,
  newTierId,
  newTierName,
  newTierColor,
  totalPoints,
  totalMatches,
}: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const emoji = TIER_EMOJI[newTierName] ?? "🎉";
  const color = newTierColor ?? "#9333ea";

  function handleDismiss() {
    setDismissed(true);
    startTransition(async () => {
      await dismissTierUpAction();
      router.refresh();
    });
  }

  async function handleShare() {
    const url = `${getAppUrl()}/u/${userId}?tier_up=${newTierId}`;
    // Sprint 50: body text TANPA URL — URL via param tunggal navigator.share.
    // Hindari duplikat saat WhatsApp gabung text + url.
    const bodyText =
      `🎉 *Tier Up!*\n\n` +
      `${displayName} reached *${newTierName}* tier ${emoji}\n` +
      `${totalPoints} pts · ${totalMatches} matches\n\n` +
      `via Carsel Club ⚡`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Tier Up! ${newTierName}`,
          text: bodyText,
          url,
        });
        handleDismiss();
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          handleDismiss();
          return;
        }
      }
    }
    // Fallback wa.me — URL inline at the end
    const waText = `${bodyText}\n\nView profile:\n${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(waText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    handleDismiss();
  }

  if (dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: `radial-gradient(circle at 50% 30%, ${color}33, var(--bg) 70%)`,
          borderRadius: "var(--r-2xl)",
          padding: "var(--s-6) var(--s-5)",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          border: `2px solid ${color}`,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "var(--text-500)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          🎉 Tier Up!
        </div>

        <div
          style={{
            fontSize: 96,
            lineHeight: 1,
            marginBottom: 16,
            filter: `drop-shadow(0 4px 12px ${color}80)`,
          }}
        >
          {emoji}
        </div>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-500)",
            marginBottom: 4,
          }}
        >
          You&apos;ve reached
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 36,
            color,
            margin: "0 0 var(--s-3) 0",
            textShadow: `0 2px 8px ${color}40`,
          }}
        >
          {newTierName}
        </h2>

        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            marginBottom: "var(--s-4)",
          }}
        >
          {totalPoints} pts · {totalMatches} matches
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={handleShare}
            disabled={isPending}
            style={{
              padding: "12px 20px",
              background: color,
              color: "#0F172A",
              border: "none",
              borderRadius: "var(--r-full)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            🎉 Share Achievement
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "var(--text-500)",
              border: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Lewatkan
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
