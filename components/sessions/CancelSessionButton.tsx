"use client";

import { useState, useTransition } from "react";
import { cancelSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Cancel session ini? Stats yang sudah accrued tidak ter-revert.")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelSessionAction(sessionId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <button
        type="button"
        className="danger-link"
        onClick={handleClick}
        disabled={isPending}
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
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        <span>{isPending ? "Cancelling..." : "Cancel Session"}</span>
      </button>
    </>
  );
}
