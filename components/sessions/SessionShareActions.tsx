"use client";

import { useState } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
  sessionTitle: string;
  venueName?: string | null;
  scheduledAt: Date | string;
  hostName?: string | null;
};

function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export function SessionShareActions({
  sessionId,
  sessionTitle,
  venueName,
  scheduledAt,
  hostName,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInviteText(): string {
    const baseUrl = getAppUrl();
    const liveUrl = `${baseUrl}/s/${sessionId}`;
    const dateStr = formatDate(scheduledAt);
    const timeStr = formatTime(scheduledAt);

    let text = `🎾 *${sessionTitle}*\n`;
    text += `📅 ${dateStr} · ${timeStr}\n`;
    if (venueName) text += `📍 ${venueName}\n`;
    if (hostName) text += `👤 Host: ${hostName}\n`;
    text += `\n🔗 Live score & info:\n${liveUrl}\n`;
    text += `\nJoin via Carsel Club ⚡`;
    return text;
  }

  function handleWhatsApp() {
    const text = buildInviteText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      const baseUrl = getAppUrl();
      const liveUrl = `${baseUrl}/s/${sessionId}`;
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
      setError("Gagal copy link. Coba lagi.");
    }
  }

  // Sprint 48: download IG-portrait share card with cover + leaderboard
  const [downloading, setDownloading] = useState(false);

  async function handleShareCard() {
    setDownloading(true);
    try {
      const cardUrl = `${getAppUrl()}/api/og/session-card/${sessionId}`;
      // Fetch image as blob
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `carsel-${sessionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.png`,
        { type: "image/png" }
      );

      // Try native share with file (works on iOS/Android modern)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share({
          files: [file],
          title: sessionTitle,
          text: `${sessionTitle} — Carsel Club`,
        });
      } else {
        // Fallback: trigger download
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Share card failed:", e);
        setError("Gagal generate share card. Coba lagi.");
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
    <Toast message={error} onDismiss={() => setError(null)} />
    <div className="quick-actions">
      <button
        type="button"
        className="qa-btn primary"
        onClick={handleShareCard}
        disabled={downloading}
      >
        <div className="qa-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="12" cy="11" r="3" />
            <path d="M3 16l5-5 4 3 5-7 4 5" />
          </svg>
        </div>
        <div className="qa-title">
          {downloading ? "Generating…" : "Share Story Card"}
        </div>
        <div className="qa-sub">Cover + leaderboard untuk IG/WA</div>
      </button>
      <button
        type="button"
        className="qa-btn"
        onClick={handleWhatsApp}
      >
        <div className="qa-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <div className="qa-title">WhatsApp Invite</div>
        <div className="qa-sub">Kirim text + link</div>
      </button>
      <button
        type="button"
        className="qa-btn"
        onClick={handleCopy}
      >
        <div className="qa-icon">
          {copied ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary-700)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </div>
        <div className="qa-title">{copied ? "Tersalin!" : "Copy Link"}</div>
        <div className="qa-sub">Live view URL</div>
      </button>
    </div>
    </>
  );
}
