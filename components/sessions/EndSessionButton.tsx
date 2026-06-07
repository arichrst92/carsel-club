"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
  /** Match counts untuk confirmation context */
  completedMatches?: number;
  pendingMatches?: number;
};

export function EndSessionButton({
  sessionId,
  completedMatches = 0,
  pendingMatches = 0,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const warning =
      pendingMatches > 0
        ? `Masih ada ${pendingMatches} match yang belum selesai. Mereka tidak akan di-skor. `
        : "";
    // Sprint 50: wording lebih jelas — "Selesaikan" (sukses, dihitung)
    // vs "Batalkan" (gagal, di-skip). Hindari ambiguitas End vs Cancel.
    const msg =
      `Selesaikan sesi ini?\n\n${warning}` +
      `${completedMatches} match selesai akan tetap dihitung sebagai statistik.\n\n` +
      `Status berubah ke SELESAI. Bisa dibuka kembali nanti kalau perlu.`;
    if (!confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const result = await endSessionAction(sessionId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-primary-lg"
        style={{
          width: "100%",
          background: "var(--primary-700)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span>{isPending ? "Ending..." : "End Session"}</span>
      </button>
    </>
  );
}
