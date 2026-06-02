"use client";

import { useEffect } from "react";

type ToastKind = "error" | "success" | "info";

type Props = {
  message: string | null;
  kind?: ToastKind;
  onDismiss: () => void;
  autoHideMs?: number;
};

/**
 * Floating toast — bottom-center, auto-dismisses after `autoHideMs` (default 3000).
 * Use inline below action buttons. Replaces alert() calls.
 */
export function Toast({
  message,
  kind = "error",
  onDismiss,
  autoHideMs = 3000,
}: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(t);
  }, [message, onDismiss, autoHideMs]);

  if (!message) return null;

  const colors: Record<ToastKind, { bg: string; border: string; text: string }> = {
    error: {
      bg: "var(--accent-50)",
      border: "var(--accent-100)",
      text: "var(--accent-600)",
    },
    success: {
      bg: "var(--primary-50)",
      border: "var(--primary-100)",
      text: "var(--primary-700)",
    },
    info: {
      bg: "var(--bg-soft)",
      border: "var(--border)",
      text: "var(--text-700)",
    },
  };
  const c = colors[kind];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "calc(var(--bottomnav-h, 0px) + 24px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        padding: "12px 18px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        borderRadius: "var(--r-full)",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        boxShadow: "var(--shadow-lg)",
        maxWidth: "calc(100vw - 32px)",
        textAlign: "center",
      }}
    >
      {kind === "error" ? "⚠ " : kind === "success" ? "✓ " : ""}
      {message}
    </div>
  );
}
