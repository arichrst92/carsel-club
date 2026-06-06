"use client";

import { useTransition } from "react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
        })
      }
      disabled={pending}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--primary-700)",
        fontWeight: 700,
        fontSize: 13,
        cursor: pending ? "default" : "pointer",
        padding: "var(--s-1) var(--s-2)",
      }}
    >
      {pending ? "..." : "Tandai semua dibaca"}
    </button>
  );
}
