"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

export function StartSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Mulai sesi sekarang? Status berubah ke LIVE. Cocok kalau pemain sudah datang & siap main."
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await startSessionAction(sessionId);
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
        style={{ width: "100%" }}
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
          <path d="M5 3l14 9-14 9V3z" />
        </svg>
        <span>{isPending ? "Starting..." : "Start Session"}</span>
      </button>
    </>
  );
}
