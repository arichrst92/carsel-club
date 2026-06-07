"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const warning =
      pendingMatches > 0
        ? `${pendingMatches} match${pendingMatches > 1 ? "es" : ""} still pending — they won't be scored. `
        : "";
    // Sprint 50: clearer wording — "End" (success, counted) vs "Cancel" (failed,
    // skipped). Avoid the End-vs-Cancel ambiguity.
    const msg =
      `End this session?\n\n${warning}` +
      `${completedMatches} completed match${completedMatches === 1 ? "" : "es"} will stay counted in stats.\n\n` +
      `Status will change to COMPLETED. You can reopen it later if needed.`;
    if (!confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const result = await endSessionAction(sessionId);
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
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span>{isPending ? "Ending..." : "End Session"}</span>
      </button>
    </>
  );
}
