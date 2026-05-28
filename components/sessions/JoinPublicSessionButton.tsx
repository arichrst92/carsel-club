"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinPublicSessionAction } from "@/app/actions/find-sessions";

export function JoinPublicSessionButton({
  sessionId,
  navigateAfter,
}: {
  sessionId: string;
  navigateAfter?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await joinPublicSessionAction(sessionId);
      if (result?.error) {
        alert(result.error);
      } else if (navigateAfter) {
        router.push(navigateAfter);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`btn-primary-lg ${isPending ? "loading" : ""}`}
      style={{ width: "100%" }}
    >
      <span>{isPending ? "Joining..." : "🎾 Join Session"}</span>
      {!isPending && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
