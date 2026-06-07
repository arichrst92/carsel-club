"use client";

/**
 * Edit session form (Sprint 18).
 *
 * Single-page form (bukan wizard) untuk edit setelah create. Lock-aware:
 * kalau hasRounds, match config fields di-disable + show notice.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/create-session.html (reuse field layout)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 18
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editSessionAction } from "@/app/actions/sessions";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
  hasRounds: boolean;
  initial: {
    title: string;
    venueName: string;
    mapsUrl: string | null;
    scheduledAt: Date;
    scheduledEndAt: Date | null;
    description: string | null;
    visibility: "private" | "public";
    joinPolicy: "auto_join" | "need_approval";
    maxRounds: number | null;
    format: "americano" | "mexicano" | "tournament";
    numCourts: number;
    fixPartners: boolean;
  };
};

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditSessionForm({ sessionId, hasRounds, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [venueName, setVenueName] = useState(initial.venueName);
  const [mapsUrl, setMapsUrl] = useState(initial.mapsUrl ?? "");
  const [date, setDate] = useState(toDateInput(initial.scheduledAt));
  const [timeStart, setTimeStart] = useState(toTimeInput(initial.scheduledAt));
  const [timeEnd, setTimeEnd] = useState(
    initial.scheduledEndAt ? toTimeInput(initial.scheduledEndAt) : ""
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [visibility, setVisibility] = useState(initial.visibility);
  const [joinPolicy, setJoinPolicy] = useState(initial.joinPolicy);
  const [maxRounds, setMaxRounds] = useState(
    initial.maxRounds ? String(initial.maxRounds) : ""
  );
  const [format, setFormat] = useState(initial.format);
  const [numCourts, setNumCourts] = useState(initial.numCourts);
  const [fixPartners, setFixPartners] = useState(initial.fixPartners);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (title.trim().length < 2) {
      setError("Nama session minimal 2 karakter");
      return;
    }
    if (!date || !timeStart) {
      setError("Tanggal & jam required");
      return;
    }
    const scheduledAt = new Date(`${date}T${timeStart}`);
    if (isNaN(scheduledAt.getTime())) {
      setError("Format tanggal tidak valid");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("venue_name", venueName.trim());
      if (mapsUrl.trim()) fd.set("maps_url", mapsUrl.trim());
      fd.set("scheduled_at", scheduledAt.toISOString());
      if (timeEnd) {
        fd.set(
          "scheduled_end_at",
          new Date(`${date}T${timeEnd}`).toISOString()
        );
      }
      if (description.trim()) fd.set("description", description.trim());
      fd.set("visibility", visibility);
      fd.set("join_policy", joinPolicy);
      if (maxRounds) fd.set("max_rounds", maxRounds);
      // Match config — server check lock rule
      fd.set("format", format);
      fd.set("num_courts", String(numCourts));
      fd.set("fix_partners", fixPartners ? "on" : "off");

      const result = await editSessionAction(sessionId, null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <main className="app-content subscreen with-footer">
        {hasRounds && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--yellow-50, #FEF9C3)",
              border: "1px solid #FACC15",
              borderRadius: "var(--r-md)",
              marginBottom: "var(--s-3)",
              fontSize: 12,
            }}
          >
            🔒 Match config (format, court, fix partners) di-lock karena
            sudah ada round ter-generate.
          </div>
        )}

        {/* Info */}
        <section className="form-section">
          <div className="form-section-head">
            <div className="sec-icon" aria-hidden>
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </div>
            <h3>Session Info</h3>
          </div>
          <div className="form-group">
            <label className="form-label">
              Session Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Venue <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Google Maps Link (Optional)</label>
            <input
              type="url"
              className="form-input"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Tanggal <span className="req">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">
                Start Time <span className="req">*</span>
              </label>
              <input
                type="time"
                className="form-input"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-input"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi (Optional)</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </section>

        {/* Visibility + Join Policy */}
        <section className="form-section">
          <div className="form-section-head">
            <div className="sec-icon" aria-hidden>
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
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Access & Visibility</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="segmented">
              <button
                type="button"
                className={`segmented-option ${visibility === "private" ? "active" : ""}`}
                onClick={() => setVisibility("private")}
              >
                <span>🔒 Private</span>
                <span className="seg-sub">Invite-only</span>
              </button>
              <button
                type="button"
                className={`segmented-option ${visibility === "public" ? "active" : ""}`}
                onClick={() => setVisibility("public")}
              >
                <span>🌍 Public</span>
                <span className="seg-sub">Find di /find</span>
              </button>
            </div>
          </div>

          {visibility === "public" && (
            <div className="form-group">
              <label className="form-label">Join Policy</label>
              <div className="segmented">
                <button
                  type="button"
                  className={`segmented-option ${joinPolicy === "auto_join" ? "active" : ""}`}
                  onClick={() => setJoinPolicy("auto_join")}
                >
                  <span>✅ Auto-join</span>
                  <span className="seg-sub">Langsung join</span>
                </button>
                <button
                  type="button"
                  className={`segmented-option ${joinPolicy === "need_approval" ? "active" : ""}`}
                  onClick={() => setJoinPolicy("need_approval")}
                >
                  <span>📩 Approval</span>
                  <span className="seg-sub">Host review</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Match config — lock kalau hasRounds */}
        <section className="form-section">
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text-500)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Match Config {hasRounds && "(🔒 locked)"}
          </div>

          <div className="form-group">
            <label className="form-label">Format</label>
            <div className="segmented">
              {(["americano", "mexicano"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`segmented-option ${format === f ? "active" : ""}`}
                  onClick={() => !hasRounds && setFormat(f)}
                  disabled={hasRounds}
                  style={hasRounds ? { opacity: 0.6 } : undefined}
                >
                  <span style={{ textTransform: "capitalize" }}>{f}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Number of Courts</label>
            <input
              type="number"
              className="form-input"
              value={numCourts}
              onChange={(e) => setNumCourts(parseInt(e.target.value, 10) || 1)}
              disabled={hasRounds}
              min={1}
              max={20}
              style={hasRounds ? { opacity: 0.6 } : undefined}
            />
          </div>

          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: hasRounds ? "not-allowed" : "pointer",
                opacity: hasRounds ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={fixPartners}
                onChange={(e) => !hasRounds && setFixPartners(e.target.checked)}
                disabled={hasRounds}
              />
              <span className="form-label" style={{ margin: 0 }}>
                Fix Partners (Round Robin)
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Max Rounds (Optional)</label>
            <input
              type="number"
              className="form-input"
              value={maxRounds}
              onChange={(e) => setMaxRounds(e.target.value)}
              min={1}
              max={50}
              placeholder="Auto"
            />
          </div>
        </section>
      </main>

      <div className="sticky-footer">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary-lg"
          style={{ width: "100%" }}
        >
          {isPending ? "Menyimpan..." : "Save Changes"}
        </button>
      </div>
    </>
  );
}
