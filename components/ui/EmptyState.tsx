/**
 * Reusable empty-state component (Sprint 34).
 *
 * Variants via small icon + friendly Indonesian copy + optional action.
 */

import Link from "next/link";

export type EmptyStateProps = {
  emoji?: string;
  title: string;
  body?: string;
  action?:
    | { type: "link"; href: string; label: string }
    | { type: "node"; node: React.ReactNode };
};

export function EmptyState({
  emoji = "🎾",
  title,
  body,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "var(--s-6) var(--s-4)",
        gap: "var(--s-3)",
        background: "var(--bg-soft)",
        border: "1px dashed var(--border)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          display: "grid",
          placeItems: "center",
          fontSize: 36,
          background: "var(--bg-card)",
          borderRadius: "var(--r-full)",
          border: "1px solid var(--border)",
        }}
        aria-hidden
      >
        {emoji}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 800,
          color: "var(--text-900)",
          lineHeight: 1.3,
          maxWidth: 280,
        }}
      >
        {title}
      </div>
      {body && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-500)",
            fontWeight: 600,
            lineHeight: 1.5,
            maxWidth: 320,
          }}
        >
          {body}
        </div>
      )}
      {action && action.type === "link" && (
        <Link
          href={action.href}
          className="btn-primary"
          style={{ marginTop: "var(--s-2)", textDecoration: "none" }}
        >
          {action.label}
        </Link>
      )}
      {action && action.type === "node" && (
        <div style={{ marginTop: "var(--s-2)" }}>{action.node}</div>
      )}
    </div>
  );
}
