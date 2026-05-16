"use client";

import { useState, useTransition } from "react";
import { addGuestAction } from "@/app/actions/participants";

export function AddGuestForm({ sessionId }: { sessionId: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("session_id", sessionId);
      formData.set("guest_name", name.trim());
      const result = await addGuestAction(null, formData);
      if (result?.success) {
        setSuccess(`✓ ${result.success}`);
        setName("");
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={30}
          placeholder="Misal: Budi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-border text-base bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="px-4 py-3 rounded-xl bg-primary-500 text-white text-sm font-display font-bold disabled:opacity-50 hover:bg-primary-600 transition"
        >
          {isPending ? "..." : "+ Guest"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-accent-50 border border-accent-100">
          <p className="text-xs text-accent-600 font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="px-3 py-2 rounded-lg bg-primary-50 border border-primary-100">
          <p className="text-xs text-primary-700 font-semibold">{success}</p>
        </div>
      )}
    </form>
  );
}
