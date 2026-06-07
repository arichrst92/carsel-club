"use client";

import { useState, useTransition } from "react";
import { addGuestAction } from "@/app/actions/participants";

export function AddGuestForm({ sessionId }: { sessionId: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addedGuests, setAddedGuests] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("session_id", sessionId);
      formData.set("guest_name", trimmed);
      const result = await addGuestAction(null, formData);
      if (result?.success) {
        setAddedGuests((curr) => [trimmed, ...curr]);
        setName("");
      } else if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nama Guest</label>
          <div className="guest-input-row">
            <input
              type="text"
              maxLength={30}
              className="form-input"
              placeholder="Contoh: Pak Budi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="btn-add-guest"
              disabled={isPending || !name.trim()}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>{isPending ? "..." : "Add"}</span>
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
            }}
          >
            {error}
          </p>
        </div>
      )}

      <div style={{ marginTop: "var(--s-4)" }}>
        <div className="sp-section-label">
          {addedGuests.length === 0
            ? "No guests added yet"
            : `Guest Baru Ditambahkan (${addedGuests.length})`}
        </div>
        {addedGuests.length === 0 ? (
          <div
            className="empty-guest"
            style={{ marginTop: 8 }}
          >
            Type the guest name and tap Add. They’ll show up in
            session.
          </div>
        ) : (
          <div className="guest-list">
            {addedGuests.map((guestName, i) => (
              <div key={i} className="guest-item">
                <div className="sp-avatar">
                  {guestName.trim()[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="guest-item-name">{guestName}</div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--primary-700)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  ✓ Added
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
