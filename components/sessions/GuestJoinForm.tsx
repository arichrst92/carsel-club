"use client";

import { useState, useTransition } from "react";
import { joinAsGuestAction } from "@/app/actions/guest";
import { Toast } from "@/components/ui/Toast";

type Props = { sessionId: string };

export function GuestJoinForm({ sessionId }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setError("Nama harus 1-30 karakter");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", trimmed);
      const result = await joinAsGuestAction(sessionId, null, fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <form onSubmit={handleSubmit}>
        <section
          style={{
            padding: "var(--s-5)",
            background: "var(--bg)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text-500)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Join sebagai Guest
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-900)",
              marginBottom: 12,
            }}
          >
            Siapa namamu?
          </h3>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Pak Eko"
            className="form-input"
            maxLength={30}
            disabled={isPending}
            autoFocus
            style={{ marginBottom: 8 }}
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 600,
            }}
          >
            Ini muncul di lineup match + leaderboard session. Tidak punya
            tier atau stats lifetime.
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending || name.trim().length < 1}
          className="btn-primary-lg"
          style={{ width: "100%" }}
        >
          {isPending ? "Menyatu..." : "🎾 Join as Guest"}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Setelah join, kamu akan masuk ke live view session.
        </p>
      </form>
    </>
  );
}
