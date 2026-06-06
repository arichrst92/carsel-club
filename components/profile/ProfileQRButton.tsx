"use client";

import { useState } from "react";

type Props = {
  userId: string;
  displayName: string;
};

function getAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export function ProfileQRButton({ userId, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const profileUrl = `${getAppOrigin()}/u/${userId}`;
  const qrSrc = `/api/qr/profile/${userId}`;

  async function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        alert("Link disalin");
      } catch {
        // ignore
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 14px",
          background: "var(--bg)",
          color: "var(--text-900)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-full)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 12,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <line x1="14" y1="14" x2="14" y2="17" />
          <line x1="14" y1="20" x2="17" y2="20" />
          <line x1="17" y1="14" x2="20" y2="14" />
          <line x1="20" y1="17" x2="20" y2="20" />
        </svg>
        QR Code
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              borderRadius: "var(--r-2xl)",
              padding: "var(--s-5)",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                color: "var(--text-900)",
                marginBottom: 4,
              }}
            >
              Scan untuk lihat profile
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-500)",
                fontWeight: 600,
                marginBottom: "var(--s-4)",
              }}
            >
              {displayName}
            </div>

            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: "var(--r-md)",
                marginBottom: "var(--s-3)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={qrSrc}
                alt="QR Code"
                style={{ width: 240, height: 240 }}
              />
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-500)",
                fontFamily: "monospace",
                wordBreak: "break-all",
                padding: "8px 12px",
                background: "var(--bg-soft)",
                borderRadius: "var(--r-md)",
                marginBottom: "var(--s-3)",
              }}
            >
              {profileUrl}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={copyLink}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "var(--bg)",
                  color: "var(--text-900)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-full)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                📋 Copy Link
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-primary-lg"
                style={{ flex: 1, padding: "10px 14px", fontSize: 12 }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
