"use client";

/**
 * Reusable route-group error fallback (Sprint 34).
 *
 * Used by app/<section>/error.tsx files.
 */

import { useEffect } from "react";
import { parseFriendlyError } from "@/lib/errors/friendly";

export type RouteErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Optional context label (e.g., "session", "profile") shown in dev info */
  scope?: string;
};

export function RouteErrorFallback({
  error,
  reset,
  scope,
}: RouteErrorFallbackProps) {
  const friendly = parseFriendlyError(error);

  useEffect(() => {
    fetch("/api/log/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        scope,
        path:
          typeof window !== "undefined" ? window.location.pathname : null,
      }),
    }).catch(() => {});
  }, [error, scope]);

  return (
    <div
      role="alert"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--s-3)",
        padding: "var(--s-6)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 56 }} aria-hidden>
        {friendly.category === "network" ? "📡" : "😵"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 20,
          color: "var(--text-900)",
        }}
      >
        {friendly.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-500)",
          fontWeight: 600,
          lineHeight: 1.5,
          maxWidth: 320,
        }}
      >
        {friendly.body}
      </div>
      {friendly.retryable && (
        <button
          type="button"
          onClick={reset}
          className="btn-primary"
          style={{ marginTop: "var(--s-2)", minWidth: 160 }}
        >
          Coba Lagi
        </button>
      )}
      {process.env.NODE_ENV === "development" && (
        <details
          style={{
            marginTop: "var(--s-4)",
            textAlign: "left",
            fontSize: 11,
            color: "var(--text-500)",
            width: "100%",
            maxWidth: 420,
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Dev info{scope ? ` · ${scope}` : ""}
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
  );
}
