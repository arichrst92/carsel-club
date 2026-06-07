"use client";

import { useState, useTransition } from "react";
import { recomputeUserStatsAction } from "@/app/actions/admin";

export function RecomputeButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function run() {
    if (!confirm("Recompute user stats? This will overwrite current values.")) return;
    setResult(null);
    startTransition(async () => {
      const r = await recomputeUserStatsAction(userId);
      if ("error" in r) {
        setResult(`❌ ${r.error}`);
      } else {
        const changes = r.diff.length;
        setResult(
          `✓ Done — ${changes} field changed, tier=${r.newTierId}, achievements added=${r.achievementsAdded}`
        );
      }
    });
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
    >
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Recomputing…" : "🔄 Recompute stats + achievements"}
      </button>
      {result && (
        <div
          role="status"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: result.startsWith("❌")
              ? "var(--danger-700, #b91c1c)"
              : "var(--success-700, #15803d)",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
