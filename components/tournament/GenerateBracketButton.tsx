"use client";

import { useState, useTransition } from "react";
import { generateBracketAction } from "@/app/actions/tournament";

export function GenerateBracketButton({ sessionId }: { sessionId: string }) {
  const [seeding, setSeeding] = useState<"by_join_order" | "random">(
    "by_join_order"
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const r = await generateBracketAction(sessionId, seeding);
      if ("error" in r) setError(r.error);
    });
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--text-900)",
          }}
        >
          🏆 Generate bracket
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          Single elimination — winner advance ke round berikut otomatis
        </div>
      </div>

      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-1)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-700)",
        }}
      >
        Seeding
        <select
          value={seeding}
          onChange={(e) =>
            setSeeding(e.target.value as "by_join_order" | "random")
          }
          style={{
            padding: "var(--s-2) var(--s-3)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            fontSize: 14,
            background: "var(--bg-card)",
            color: "var(--text-900)",
          }}
        >
          <option value="by_join_order">Urutan join</option>
          <option value="random">Acak</option>
        </select>
      </label>

      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Generating…" : "Generate bracket"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: "var(--danger-700, #b91c1c)",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
