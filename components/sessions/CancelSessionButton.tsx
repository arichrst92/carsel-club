"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Batalkan sesi ini? Statistik yang sudah masuk tidak akan ter-reset."
      )
    )
      return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await cancelSessionAction(sessionId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // Sprint 50: refresh client-side supaya status badge + tombol
      // update tanpa user reload manual.
      setSuccess("Session cancelled.");
      router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />
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
