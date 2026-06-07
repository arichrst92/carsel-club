/**
 * Offline fallback page (Sprint 33).
 *
 * Served by service worker saat navigation gagal + no cached response.
 * Static — no data dependencies.
 */

import { OfflineRetryButton } from "./OfflineRetryButton";

export const metadata = {
  title: "Offline — Carsel Club",
};

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-6)",
        textAlign: "center",
        gap: "var(--s-4)",
        background: "var(--bg-soft)",
      }}
    >
      <div style={{ fontSize: 72 }}>📡</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--text-900)",
        }}
      >
        No connection
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-500)",
          fontWeight: 600,
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Carsel Club needs an internet connection to fetch sessions and the
        leaderboard. Check your connection and reload.
      </div>
      <OfflineRetryButton />
    </div>
  );
}
