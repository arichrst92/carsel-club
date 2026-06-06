/**
 * Root not-found (Sprint 34).
 */

import Link from "next/link";

export const metadata = {
  title: "Tidak ditemukan",
};

export default function RootNotFound() {
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
        background: "var(--bg-canvas)",
      }}
    >
      <div style={{ fontSize: 72 }} aria-hidden>
        🧐
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 24,
          color: "var(--text-900)",
        }}
      >
        Halaman tidak ditemukan
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
        Link mungkin sudah pindah atau salah ketik. Balik ke beranda yuk.
      </div>
      <Link href="/home" className="btn-primary" style={{ minWidth: 160 }}>
        Ke beranda
      </Link>
    </div>
  );
}
