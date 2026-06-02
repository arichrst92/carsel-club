"use client";

/**
 * Root error boundary (catches errors di server + client components).
 *
 * Side effect: log error ke /monitor via fire-and-forget POST ke API route.
 * Tidak block UI — kalau log gagal, user tetap dapat fallback.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Fire-and-forget POST ke client log endpoint
    fetch("/api/log/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    }).catch(() => {
      // Logging failure is non-critical
    });
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg-canvas)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 24,
          background: "var(--bg)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-card)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>😵</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--text-900)",
            marginBottom: 8,
          }}
        >
          Ada masalah
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-500)",
            fontWeight: 600,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Sesuatu tidak berjalan sesuai rencana. Tim sudah dapet notifikasi.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            borderRadius: "var(--r-full)",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Coba Lagi
        </button>
        {process.env.NODE_ENV === "development" && (
          <details
            style={{
              marginTop: 20,
              textAlign: "left",
              fontSize: 11,
              color: "var(--text-500)",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              Dev info
            </summary>
            <pre
              style={{
                marginTop: 8,
                padding: 8,
                background: "var(--bg-soft)",
                borderRadius: "var(--r-sm)",
                overflow: "auto",
                fontSize: 10,
              }}
            >
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
