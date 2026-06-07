"use client";

/**
 * DeleteRoundButton — Sprint 53.
 *
 * Tiny destructive link rendered in the round header. Server-side guards
 * (latest round only, all pending) live in deleteRoundAction.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRoundAction } from "@/app/actions/matches";

type Props = {
  roundSetId: string;
  roundNumber: number;
};

export function DeleteRoundButton({ roundSetId, roundNumber }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Delete Round ${roundNumber} and all its matches? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteRoundAction(roundSetId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Delete this round"
      style={{
        padding: "4px 10px",
        borderRadius: "var(--r-full)",
        background: "var(--accent-50)",
        color: "var(--accent-600)",
        border: "1px solid var(--accent-100)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        cursor: isPending ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      </svg>
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
