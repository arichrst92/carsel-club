"use client";

/**
 * Fallback paling akhir kalau root error.tsx itself crash.
 * Tidak ada dependency ke layout — minimal HTML.
 */

export default function GlobalErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          padding: 24,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f8fafc",
          color: "#1e293b",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 24,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>💥</div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>
            Sistem mengalami masalah
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            Silakan reload halaman atau coba lagi nanti.
          </p>
          <a
            href="/"
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "#14b8a6",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 13,
              display: "inline-block",
            }}
          >
            Ke Beranda
          </a>
          {process.env.NODE_ENV === "development" && (
            <pre
              style={{
                marginTop: 16,
                padding: 8,
                fontSize: 10,
                textAlign: "left",
                overflow: "auto",
                background: "#f1f5f9",
                borderRadius: 4,
              }}
            >
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
