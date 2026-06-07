"use client";

/**
 * AddFriendActions — combines AddFriendForm (search by phone) + a
 * "Scan QR" button that opens QRScanModal.
 *
 * QR scan flow (Sprint 52):
 *   1. Modal opens, scans QR
 *   2. On scan → look up the user → show preview modal with
 *      "Add as friend?" confirmation
 *   3. On confirm → sendFriendRequestAction
 *
 * (Previously the QR callback routed straight to /u/{userId}; this caused
 * confusion because the public-profile view used to show Follow/Block
 * buttons, not the friend-request flow.)
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddFriendForm } from "./AddFriendForm";
import { QRScanModal } from "./QRScanModal";
import {
  lookupUserForPreviewAction,
  sendFriendRequestAction,
} from "@/app/actions/friend-requests";
import { Toast } from "@/components/ui/Toast";

type Preview = {
  id: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
};

export function AddFriendActions() {
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleScan(userId: string) {
    const result = await lookupUserForPreviewAction(userId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPreview(result);
  }

  function sendRequest() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      const result = await sendFriendRequestAction(preview.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(result?.success ?? "Request sent!");
        router.refresh();
      }
      setPreview(null);
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
          Scan Friend QR
        </button>
      </div>

      {scanOpen && (
        <QRScanModal
          onScan={handleScan}
          onClose={() => setScanOpen(false)}
        />
      )}

      {preview && (
        <ConfirmAddFriendModal
          preview={preview}
          pending={pending}
          onConfirm={sendRequest}
          onCancel={() => setPreview(null)}
        />
      )}
    </>
  );
}

function ConfirmAddFriendModal({
  preview,
  pending,
  onConfirm,
  onCancel,
}: {
  preview: Preview;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const initial = (preview.displayName.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          borderRadius: 18,
          padding: 20,
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            margin: "0 auto 12px",
            background: preview.avatarUrl
              ? `url(${preview.avatarUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, #FB7185, #F43F5E)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            border: "3px solid var(--bg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {!preview.avatarUrl && initial}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-900)",
          }}
        >
          {preview.displayName}
        </div>
        {preview.city && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            📍 {preview.city}
          </div>
        )}
        <p
          style={{
            fontSize: 13,
            color: "var(--text-700)",
            fontWeight: 600,
            margin: "16px 0",
            lineHeight: 1.5,
          }}
        >
          Send {preview.displayName} a friend request?
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-secondary-lg"
            style={{ flex: 1 }}
          >
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn-primary-lg"
            style={{ flex: 1 }}
          >
            <span>{pending ? "Sending..." : "Send Request"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
