"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateRoundAction } from "@/app/actions/matches";
import { Toast } from "@/components/ui/Toast";

type Props = {
  roundSetId: string;
  roundNumber: number;
};

export function RegenerateRoundButton({ roundSetId, roundNumber }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Regenerate Round ${roundNumber}?\n\nExisting matches will be deleted and new pairings will be generated. Only allowed when all matches are still pending.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await regenerateRoundAction(roundSetId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="Delete matches + regenerate"
        style={{
          padding: "6px 12px",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-full)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 11,
          color: "var(--text-700)",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ↺ {isPending ? "..." : "Regenerate"}
      </button>
    </>
  );
}
