"use client";

/**
 * AddFriendActions — gabungkan AddFriendForm (search by phone) +
 * tombol "Scan QR" yang buka QRScanModal.
 *
 * Refs:
 * - AddFriendForm: pre-existing
 * - QRScanModal: Sprint 50
 */

import { useState } from "react";
import { AddFriendForm } from "./AddFriendForm";
import { QRScanModal } from "./QRScanModal";

export function AddFriendActions() {
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: "var(--s-3)",
        }}
      >
        <AddFriendForm />
        <button
          type="button"
          onClick={() => setScanOpen(true)}
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
          Pindai QR Teman
        </button>
      </div>

      {scanOpen && <QRScanModal onClose={() => setScanOpen(false)} />}
    </>
  );
}
