"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, formatTimeRange } from "@/lib/utils";
import { Toast } from "@/components/ui/Toast";
import {
  renderSessionShareCard,
  type ShareCardData,
} from "@/lib/share/render-card";

type Props = {
  sessionId: string;
  sessionTitle: string;
  venueName?: string | null;
  scheduledAt: Date | string;
  scheduledEndAt?: Date | string | null;
  hostName?: string | null;
  /** Sprint 50: extended utk share card client-side */
  status?: "upcoming" | "live" | "completed" | "cancelled";
  format?: string;
  coverPhotoUrl?: string | null;
  playerCount?: number;
  completedMatches?: number;
  topPlayers?: Array<{
    name: string;
    wins: number;
    draws: number;
    losses: number;
    points: number;
  }>;
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
  scheduledEndAt = null,
  hostName,
  status = "upcoming",
  format = "americano",
  coverPhotoUrl = null,
  playerCount = 0,
  completedMatches = 0,
  topPlayers = [],
}: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInviteText(): string {
    const baseUrl = getAppUrl();
    const liveUrl = `${baseUrl}/s/${sessionId}`;
    const dateStr = formatDate(scheduledAt);
    // Sprint 50: kalau ada scheduledEndAt → tampilkan range "HH:MM – HH:MM"
    const timeStr = scheduledEndAt
      ? formatTimeRange(scheduledAt, scheduledEndAt)
      : formatTime(scheduledAt);

    let text = `🎾 *${sessionTitle}*\n`;
    text += `📅 ${dateStr}\n`;
    text += `⏰ ${timeStr}\n`;
    if (venueName) text += `📍 ${venueName}\n`;
    if (hostName) text += `👤 Host: ${hostName}\n`;
    text += `\n🔗 Skor live & info:\n${liveUrl}\n`;
    text += `\nGabung via Carsel Club ⚡`;
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
      setError("Gagal salin tautan. Coba lagi.");
    }
  }

  // Sprint 48: download IG-portrait share card with cover + leaderboard
  const [downloading, setDownloading] = useState(false);

  async function handleShareCard() {
    setDownloading(true);
    try {
      // Sprint 50: client-side render via canvas — drop dependency
      // ke /api/og/session-card yang sering bermasalah dgn Satori.
      const baseUrl = getAppUrl();
      const data: ShareCardData = {
        title: sessionTitle,
        status,
        scheduledAt,
        scheduledEndAt,
        venueName: venueName ?? null,
        format,
        playerCount,
        completedMatches,
        top: topPlayers,
        coverPhotoUrl: coverPhotoUrl
          ? coverPhotoUrl.startsWith("http")
            ? coverPhotoUrl
            : `${baseUrl}${coverPhotoUrl}`
          : null,
        logoUrl: `${baseUrl}/full-logo.png`,
        sessionShortId: sessionId.slice(0, 8),
      };

      const blob = await renderSessionShareCard(data);
      const file = new File(
        [blob],
        `carsel-${sessionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}.png`,
        { type: "image/png" }
      );

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
        setError(
          `Gagal membuat kartu sesi. ${(e as Error).message || "Coba lagi."}`
        );
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
          {downloading ? "Membuat…" : "Bagikan Kartu Sesi"}
        </div>
        <div className="qa-sub">Sampul + papan peringkat utk IG/WA</div>
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
        <div className="qa-title">Undang via WhatsApp</div>
        <div className="qa-sub">Kirim teks + link</div>
      </button>
      <Link
        href={`/sessions/${sessionId}/leaderboard`}
        className="qa-btn"
        style={{ textDecoration: "none", color: "inherit" }}
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
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <div className="qa-title">Papan Peringkat</div>
        <div className="qa-sub">Peringkat pemain sesi ini</div>
      </Link>
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
        <div className="qa-title">{copied ? "Tersalin!" : "Salin Tautan"}</div>
        <div className="qa-sub">URL tampilan langsung</div>
      </button>
    </div>
    </>
  );
}
