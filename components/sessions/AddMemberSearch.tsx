"use client";

import { useState, useTransition } from "react";
import {
  searchMemberAction,
  addMemberAction,
  type FoundUser,
} from "@/app/actions/participants";

export function AddMemberSearch({ sessionId }: { sessionId: string }) {
  const [phone, setPhone] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setSuccess(null);
    setFoundUser(null);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (!phone.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("phone", phone);
      const result = await searchMemberAction(null, formData);
      if (result?.foundUser) setFoundUser(result.foundUser);
      else if (result?.error) setError(result.error);
    });
  }

  function handleAdd() {
    if (!foundUser) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("session_id", sessionId);
      formData.set("user_id", foundUser.id);
      const result = await addMemberAction(null, formData);
      if (result?.success) {
        setSuccess(`✓ ${foundUser.displayName} ditambahkan`);
        setFoundUser(null);
        setPhone("");
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          placeholder="08123456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-border text-base bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
        />
        <button
          type="submit"
          disabled={isPending || !phone.trim()}
          className="px-4 py-3 rounded-xl bg-bg-soft border border-border-light text-text-700 font-bold text-sm disabled:opacity-50 hover:border-primary-200 transition"
        >
          {isPending ? "..." : "Cari"}
        </button>
      </form>

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

      {foundUser && (
        <div className="rounded-xl bg-bg-card border border-primary-200 p-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white grid place-items-center font-display font-bold text-sm shrink-0">
              {foundUser.displayName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-900 truncate">
                {foundUser.displayName}
              </div>
              <div className="text-xs text-text-500 truncate">
                +{foundUser.whatsappNumber}
                {foundUser.city && ` · ${foundUser.city}`}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className="px-3 py-2 rounded-lg bg-primary-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 hover:bg-primary-600 transition"
            >
              {isPending ? "..." : "+ Tambah"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
