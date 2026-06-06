/**
 * Shared shell for legal/help pages (Sprint 37).
 */

import Link from "next/link";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/profile" className="back-btn" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">{title}</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{
          padding: "var(--s-4)",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <article
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "var(--s-5)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text-900)",
          }}
        >
          {children}
        </article>
      </main>
    </div>
  );
}
