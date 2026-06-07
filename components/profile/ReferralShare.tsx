"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/Toast";

type Props = {
  userId: string;
  displayName: string;
};

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export function ReferralShare({ userId, displayName }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl = `${getAppUrl()}/invite/${userId}`;
  // Sprint 50: body text TANPA URL utk navigator.share — supaya tidak
  // duplikat saat WhatsApp gabungkan text + url. Fallback wa.me yang
  // butuh URL inline akan tambah di akhir di handleShare.
  const bodyText = `🎾 Join Carsel Club — komunitas padel Indonesia.

Manage padel sessions, realtime scoring, leaderboard, and share results — all in one app.

Invited by ${displayName}.`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Gabung Carsel Club",
          text: bodyText,
          url: inviteUrl,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Fallback wa.me — URL inline di akhir
    const waText = `${bodyText}\n\nSign up via link:\n${inviteUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
      setError("Gagal copy link.");
    }
  }

  return (
    <section>
      <Toast message={error} onDismiss={() => setError(null)} />
      <div className="section-head">
        <h3>Undang Teman</h3>
      </div>
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--accent), var(--accent-600))",
          color: "#fff",
          borderRadius: "var(--r-xl)",
          padding: "var(--s-4)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: "var(--s-3)",
          }}
        >
          <div style={{ fontSize: 28 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                marginBottom: 2,
              }}
            >
              Ajak teman padelmu!
            </div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.9,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              Bagikan link, teman daftar via OTP WhatsApp. Cepat.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "10px 12px",
            background: "rgba(255,255,255,0.18)",
            borderRadius: "var(--r-md)",
            fontSize: 11,
            fontFamily: "ui-monospace, monospace",
            fontWeight: 600,
            wordBreak: "break-all",
            marginBottom: "var(--s-3)",
          }}
        >
          {inviteUrl}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              flex: 2,
              padding: "10px 14px",
              background: "#fff",
              color: "var(--accent-600)",
              border: "none",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Bagikan via WhatsApp
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Tersalin" : "Salin"}
          </button>
        </div>
      </div>
    </section>
  );
}
