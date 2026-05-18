"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateRoundAction } from "@/app/actions/matches";

type Props = {
  sessionId: string;
  nextRoundNumber: number;
  activePlayerCount: number;
  redirectAfter?: string; // path to redirect after success
  variant?: "primary" | "footer";
};

export function GenerateRoundButton({
  sessionId,
  nextRoundNumber,
  activePlayerCount,
  redirectAfter,
  variant = "primary",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const insufficient = activePlayerCount < 4;
  const isDisabled = insufficient || isPending;

  function handleClick() {
    startTransition(async () => {
      const result = await generateRoundAction(sessionId);
      if (result?.error) {
        alert(result.error);
      } else if (redirectAfter) {
        router.push(redirectAfter);
        router.refresh();
      }
    });
  }

  const label = isPending
    ? "Generating..."
    : nextRoundNumber === 1
      ? "Generate Round 1"
      : `Generate Round ${nextRoundNumber}`;

  if (variant === "footer") {
    return (
      <div className="sticky-footer">
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          className={`btn-primary-lg ${isPending ? "loading" : ""}`}
        >
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
            <path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M18 12h4" />
          </svg>
          <span>{label}</span>
        </button>
        {insufficient && (
          <p
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              textAlign: "center",
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            Butuh minimal 4 pemain aktif (sekarang {activePlayerCount}).
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`btn-primary-lg ${isPending ? "loading" : ""}`}
        style={{ width: "100%" }}
      >
        <span>{label}</span>
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
      {insufficient && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            textAlign: "center",
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          Butuh minimal 4 pemain aktif (sekarang {activePlayerCount}).
        </p>
      )}
    </div>
  );
}
