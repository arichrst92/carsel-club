"use client";

/**
 * Celebration modal saat user buka /home dan ada achievement baru
 * yang belum di-dismiss (Sprint 29).
 *
 * Pattern mirror TierUpModal:
 * - Auto-show pada mount
 * - Tap "Yay!" → dismissAction
 * - Close via overlay tap or button
 */

import { useState, useTransition } from "react";
import { dismissAchievementAction } from "@/app/actions/achievements";

export type AchievementUnlockedModalProps = {
  achievementId: string;
  emoji: string;
  name: string;
  description: string;
};

export function AchievementUnlockedModal(
  props: AchievementUnlockedModalProps
) {
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();

  if (!open) return null;

  function dismiss() {
    setOpen(false);
    startTransition(async () => {
      await dismissAchievementAction(props.achievementId);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        padding: "var(--s-4)",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--r-2xl)",
          padding: "var(--s-6) var(--s-5)",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--primary-700)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Achievement Unlocked
        </div>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
          {props.emoji}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text-900)",
            marginBottom: 8,
          }}
        >
          {props.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-700)",
            fontWeight: 600,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {props.description}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="btn-primary"
          style={{ minWidth: 140 }}
        >
          Yay! 🎉
        </button>
      </div>
    </div>
  );
}
