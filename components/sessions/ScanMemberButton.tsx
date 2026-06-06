"use client";

/**
 * Tombol "Pindai QR Pemain" di halaman Tambah Pemain sesi.
 *
 * Flow:
 * 1. Host buka modal scan
 * 2. Arahkan ke QR profil pemain
 * 3. Detect → extract userId → call addMemberAction(sessionId, userId)
 * 4. Sukses toast / error feedback
 *
 * Reuse `QRScanModal` (sama yang dipakai di /friends).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRScanModal } from "@/components/friends/QRScanModal";
import { addMemberAction } from "@/app/actions/participants";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
};

export function ScanMemberButton({ sessionId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();

  async function handleScan(userId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("session_id", sessionId);
      fd.set("user_id", userId);
      const result = await addMemberAction(null, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess("✓ Pemain ditambahkan ke sesi.");
      router.refresh();
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 14px",
          background: "var(--bg)",
          color: "var(--primary-700)",
          border: "1.5px solid var(--primary-200)",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
          width: "100%",
          marginBottom: 12,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3M20 14h1M14 17v3M14 21h7M21 17v4" />
        </svg>
        Pindai QR Pemain
      </button>

      {open && (
        <QRScanModal
          title="Pindai QR Pemain"
          subtitle="Arahkan kamera ke QR Code di halaman Profil pemain. Pemain otomatis ditambahkan ke sesi."
          onScan={handleScan}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
