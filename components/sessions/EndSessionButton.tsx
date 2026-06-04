"use client";

import { useState, useTransition } from "react";
import { endSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
  /** Match counts untuk confirmation context */
  completedMatches?: number;
  pendingMatches?: number;
};

export function EndSessionButton({
  sessionId,
  completedMatches = 0,
  pendingMatches = 0,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const warning =
      pendingMatches > 0
        ? `Masih ada ${pendingMatches} match yang belum selesai. Mereka tidak akan di-score. `
        : "";
    const msg =
      `End session sekarang?\n\n${warning}` +
      `${completedMatches} match selesai akan tetap dihitung.\n\n` +
      `Status berubah ke SELESAI. Kamu bisa Reopen nanti kalau perlu.`;
    if (!confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const result = await endSessionAction(sessionId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-primary-lg"
        style={{
          width: "100%",
          background: "var(--primary-700)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
        <span>{isPending ? "Menutup..." : "End Session"}</span>
      </button>
    </>
  );
}
