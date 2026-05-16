"use client";

import { useTransition } from "react";
import { generateRoundAction } from "@/app/actions/matches";

type Props = {
  sessionId: string;
  nextRoundNumber: number;
  activePlayerCount: number;
  disabled?: boolean;
};

export function GenerateRoundButton({
  sessionId,
  nextRoundNumber,
  activePlayerCount,
  disabled,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const insufficient = activePlayerCount < 4;
  const isDisabled = disabled || insufficient || isPending;

  function handleClick() {
    startTransition(async () => {
      const result = await generateRoundAction(sessionId);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="w-full py-3 rounded-xl bg-primary-500 text-white font-display font-bold text-base shadow-fab disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 active:scale-[0.98] transition"
      >
        {isPending
          ? "Generating..."
          : nextRoundNumber === 1
            ? "Generate Round 1"
            : `Generate Round ${nextRoundNumber}`}
      </button>
      {insufficient && (
        <p className="text-xs text-text-500 text-center">
          Butuh minimal 4 pemain aktif (sekarang {activePlayerCount}).
        </p>
      )}
    </div>
  );
}
