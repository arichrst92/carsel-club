"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reopenSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

export function ReopenSessionButton({
  sessionId,
  hasRounds,
}: {
  sessionId: string;
  hasRounds: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const target = hasRounds ? "LIVE" : "MENDATANG";
    if (
      !confirm(
        `Buka kembali sesi ini?\n\nStatus akan kembali ke ${target}. Statistik yang sudah masuk tetap ada.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await reopenSessionAction(sessionId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "var(--r-md)",
          background: "var(--bg)",
          color: "var(--text-900)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <span>
          {isPending
            ? "Reopening..."
            : `Reopen Session${hasRounds ? " (Live)" : ""}`}
        </span>
      </button>
    </>
  );
}
