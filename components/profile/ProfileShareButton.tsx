"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/Toast";

type Props = {
  userId: string;
  displayName: string;
  tierName: string | null;
  totalPoints: number;
};

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export function ProfileShareButton({
  userId,
  displayName,
  tierName,
  totalPoints,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);

  async function handleShare() {
    const url = `${getAppUrl()}/u/${userId}`;
    const tierBit = tierName ? ` · ${tierName}` : "";
    const text =
      `🎾 *${displayName}* di Carsel Club${tierBit}\n` +
      `${totalPoints} pts\n\n` +
      `Lihat profile lengkap:\n${url}\n\n` +
      `Padel community Indonesia ⚡`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} — Carsel Club`,
          text,
          url,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Fallback: WhatsApp share intent
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setToast("Membuka WhatsApp...");
  }

  return (
    <>
      <Toast message={toast} kind="info" onDismiss={() => setToast(null)} />
      <button
        type="button"
        onClick={handleShare}
        style={{
          padding: "12px 18px",
          width: "100%",
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--r-full)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        Share My Profile
      </button>
    </>
  );
}
