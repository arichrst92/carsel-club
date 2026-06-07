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

  function handleSearch(e: React.FormEvent) {
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
    <>
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label className="form-label">Nomor WhatsApp</label>
          <div className="input-with-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="tel"
              inputMode="tel"
              className="form-input"
              placeholder="08123456789"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/[^\d]/g, ""))
              }
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              className="btn-primary-lg"
              disabled={isPending || !phone.trim()}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 13,
              }}
            >
              {isPending ? "Searching..." : "Cari Member"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div
          style={{
            marginTop: "var(--s-3)",
            padding: "10px 12px",
            background: "var(--accent-50)",
            border: "1px solid var(--accent-100)",
            borderRadius: "var(--r-md)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--accent-600)",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: "var(--s-3)",
            padding: "10px 12px",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            borderRadius: "var(--r-md)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--primary-700)",
              fontWeight: 700,
            }}
          >
            {success}
          </p>
        </div>
      )}

      {foundUser && (
        <div style={{ marginTop: "var(--s-3)" }}>
          <div className="sp-section-label">Member Ditemukan</div>
          <div className="player-list-item" style={{ marginTop: 8 }}>
            <div
              className="player-avatar-lg member-1"
              style={{ background: "linear-gradient(135deg, #06B6D4, #0EA5E9)" }}
            >
              {foundUser.displayName.trim()[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="player-info">
              <div className="player-name">
                <span>{foundUser.displayName}</span>
              </div>
              <div className="player-meta-row">
                <span style={{ fontSize: 12, color: "var(--text-500)" }}>
                  +{foundUser.whatsappNumber}
                  {foundUser.city && ` · 📍 ${foundUser.city}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className="btn-primary-lg"
              style={{
                padding: "8px 14px",
                fontSize: 12,
                width: "auto",
                flexShrink: 0,
              }}
            >
              {isPending ? "..." : "+ Tambah"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
