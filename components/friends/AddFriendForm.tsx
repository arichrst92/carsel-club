"use client";

import { useState, useTransition } from "react";
import {
  searchUserForFriendAction,
  addFriendAction,
} from "@/app/actions/friends";

export function AddFriendForm() {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<{
    id: string;
    displayName: string;
    whatsappNumber: string;
    city: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setSuccess(null);
    setFound(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (!phone.trim()) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("phone", phone);
      const result = await searchUserForFriendAction(null, fd);
      if (result?.foundUser) setFound(result.foundUser);
      else if (result?.error) setError(result.error);
    });
  }

  function handleAdd() {
    if (!found) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("friend_id", found.id);
      const result = await addFriendAction(null, fd);
      if (result?.success) {
        setSuccess(result.success);
        setFound(null);
        setPhone("");
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <section>
      <div className="section-head">
        <h3>Tambah Friend</h3>
      </div>
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label className="form-label">Cari via Nomor WhatsApp</label>
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
          <button
            type="submit"
            disabled={isPending || !phone.trim()}
            className="btn-primary-lg"
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 16px",
              fontSize: 13,
            }}
          >
            {isPending ? "Mencari..." : "Cari User"}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--accent-50)",
            border: "1px solid var(--accent-100)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-2)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--accent-600)",
              fontWeight: 700,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-2)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--primary-700)",
              fontWeight: 700,
            }}
          >
            ✓ {success}
          </p>
        </div>
      )}

      {found && (
        <div className="player-list-item" style={{ marginTop: 8 }}>
          <div
            className="player-avatar-lg member-1"
            style={{
              background: "linear-gradient(135deg, #06B6D4, #0EA5E9)",
            }}
          >
            {(found.displayName.trim()[0] ?? "?").toUpperCase()}
          </div>
          <div className="player-info">
            <div className="player-name">
              <span>{found.displayName}</span>
            </div>
            <div className="player-meta-row">
              <span style={{ fontSize: 12, color: "var(--text-500)" }}>
                +{found.whatsappNumber}
                {found.city && ` · 📍 ${found.city}`}
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
            {isPending ? "..." : "+ Friend"}
          </button>
        </div>
      )}
    </section>
  );
}
