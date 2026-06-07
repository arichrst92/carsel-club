"use client";

import { useState } from "react";
import Link from "next/link";
import { AddMemberSearch } from "./AddMemberSearch";
import { AddGuestForm } from "./AddGuestForm";
import { ScanMemberButton } from "./ScanMemberButton";

type Tab = "member" | "guest";

export function AddParticipantsTabs({
  sessionId,
  sessionTitle,
}: {
  sessionId: string;
  sessionTitle: string;
}) {
  const [tab, setTab] = useState<Tab>("member");

  return (
    <>
      <header className="modal-header">
        <Link
          href={`/sessions/${sessionId}`}
          className="modal-close"
          aria-label="Close"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </Link>
        <h2 className="modal-title">Add Players</h2>
      </header>

      <main className="app-content subscreen with-footer">
        <div
          style={{
            padding: "8px 12px",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Session
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-900)",
              marginTop: 2,
            }}
          >
            {sessionTitle}
          </div>
        </div>

        {/* Tabs */}
        <section className="list-tabs">
          <button
            type="button"
            className={`list-tab ${tab === "member" ? "active" : ""}`}
            onClick={() => setTab("member")}
          >
            <span>👤 Member</span>
          </button>
          <button
            type="button"
            className={`list-tab ${tab === "guest" ? "active" : ""}`}
            onClick={() => setTab("guest")}
          >
            <span>👥 Guest</span>
          </button>
        </section>

        {/* Member tab */}
        <section
          className={`tab-content ${tab === "member" ? "active" : ""}`}
          style={{ display: tab === "member" ? "block" : "none" }}
        >
          <p
            className="form-help"
            style={{ marginBottom: "var(--s-3)" }}
          >
            Cari member via nomor WhatsApp atau pindai QR profil mereka.
          </p>
          <ScanMemberButton sessionId={sessionId} />
          <AddMemberSearch sessionId={sessionId} />
        </section>

        {/* Guest tab */}
        <section
          className={`tab-content ${tab === "guest" ? "active" : ""}`}
          style={{ display: tab === "guest" ? "block" : "none" }}
        >
          <p
            className="form-help"
            style={{ marginBottom: "var(--s-3)" }}
          >
            Tambah pemain tanpa akun (nama saja). Point guest hanya muncul di
            session ini, tidak masuk ke profil lifetime.
          </p>
          <AddGuestForm sessionId={sessionId} />
        </section>
      </main>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <Link
          href={`/sessions/${sessionId}`}
          className="btn-primary-lg"
          style={{ textDecoration: "none" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Selesai</span>
        </Link>
      </div>
    </>
  );
}
