"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { createSessionAction } from "@/app/actions/sessions";

// ============================================================
// Types & defaults
// ============================================================

type FormData = {
  name: string;
  format: "americano" | "mexicano" | "tournament";
  venueName: string;
  mapsUrl: string;
  description: string;
  date: string; // YYYY-MM-DD
  timeStart: string; // HH:mm
  timeEnd: string; // HH:mm (optional)
  numCourts: number;
  roundMode: "auto" | "manual";
  roundCount: number;
  visibility: "private" | "public";
  hostIsPlaying: boolean;
  fixPartners: boolean;
};

function defaultDateStr(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultTimeStart(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function defaultTimeEnd(): string {
  const d = new Date();
  d.setHours(d.getHours() + 4);
  d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const INITIAL: FormData = {
  name: "Sabtu Sore Padel",
  format: "americano",
  venueName: "",
  mapsUrl: "",
  description: "",
  date: defaultDateStr(),
  timeStart: defaultTimeStart(),
  timeEnd: defaultTimeEnd(),
  numCourts: 2,
  roundMode: "auto",
  roundCount: 7,
  visibility: "private",
  hostIsPlaying: true,
  fixPartners: false,
};

const TOTAL_STEPS = 5;

// ============================================================
// Main wizard
// ============================================================

export function CreateSessionForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function validateStep(s: number): string | null {
    if (s === 1 && !data.name.trim()) return "Session name is required";
    if (s === 2) {
      if (!data.venueName.trim()) return "Venue is required";
      if (!data.date) return "Date is required";
      if (!data.timeStart) return "Start time is required";
    }
    return null;
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setError(null);
    } else {
      submit();
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  }

  function submit() {
    // Final validation
    const scheduledAt = new Date(`${data.date}T${data.timeStart}`);
    if (isNaN(scheduledAt.getTime())) {
      setError("Invalid date & time");
      return;
    }
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      setError("Date & time must be in the future");
      return;
    }

    let scheduledEndAt: Date | null = null;
    if (data.timeEnd) {
      scheduledEndAt = new Date(`${data.date}T${data.timeEnd}`);
      if (scheduledEndAt.getTime() <= scheduledAt.getTime()) {
        setError("End time must be after start time");
        return;
      }
    }

    const fd = new FormData();
    fd.set("title", data.name);
    fd.set("format", data.format);
    fd.set("visibility", data.visibility);
    fd.set("venue_name", data.venueName);
    fd.set("maps_url", data.mapsUrl);
    if (data.description.trim()) fd.set("description", data.description.trim());
    // Cover photo: upload via session detail after create (Sprint 9 flow)
    fd.set("scheduled_at", scheduledAt.toISOString());
    if (scheduledEndAt) fd.set("scheduled_end_at", scheduledEndAt.toISOString());
    fd.set("num_courts", String(data.numCourts));
    if (data.roundMode === "manual") fd.set("max_rounds", String(data.roundCount));
    fd.set("host_is_playing", data.hostIsPlaying ? "on" : "off");
    fd.set("fix_partners", data.fixPartners ? "on" : "off");

    startTransition(async () => {
      const result = await createSessionAction(fd);
      if (result?.error) setError(result.error);
    });
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <>
      <main className="app-content subscreen with-footer">
        {/* Progress */}
        <section className="wizard-progress">
          <div className="wizard-progress-meta">
            <span className="wizard-step-label">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span
              className="wizard-step-label"
              style={{ color: "var(--primary-700)" }}
            >
              {progressPct}%
            </span>
          </div>
          <div className="wizard-progress-track">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`wizard-progress-segment ${
                  i + 1 < step ? "done" : i + 1 === step ? "current" : ""
                }`}
              />
            ))}
          </div>
        </section>

        {/* Steps */}
        <div className="wizard-step active">
          {step === 1 && <Step1Info data={data} setField={setField} />}
          {step === 2 && <Step2Location data={data} setField={setField} />}
          {step === 3 && <Step3Players data={data} setField={setField} />}
          {step === 4 && <Step4Visibility data={data} setField={setField} />}
          {step === 5 && <Step5Review data={data} goToStep={setStep} />}
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--accent-50)",
              border: "1px solid var(--accent-100)",
              borderRadius: "var(--r-md)",
              marginTop: "var(--s-3)",
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
      </main>

      {/* Sticky Footer */}
      <div className="sticky-footer dual">
        {step > 1 ? (
          <button
            type="button"
            className="btn-secondary-lg"
            onClick={prevStep}
            disabled={isPending}
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        ) : (
          <Link href="/sessions" className="btn-secondary-lg">
            <span>Cancel</span>
          </Link>
        )}
        <button
          type="button"
          className={`btn-primary-lg ${isPending ? "loading" : ""}`}
          onClick={nextStep}
          disabled={isPending}
        >
          <span>
            {step === TOTAL_STEPS
              ? isPending
                ? "Creating..."
                : "Create Session"
              : "Next"}
          </span>
          {step !== TOTAL_STEPS && (
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
          {step === TOTAL_STEPS && !isPending && (
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
          )}
        </button>
      </div>
    </>
  );
}

// ============================================================
// Step 1 — Info Session
// ============================================================

function Step1Info({
  data,
  setField,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Session Info</h2>

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">
            Session Name <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Sabtu Sore Padel"
            value={data.name}
            onChange={(e) => setField("name", e.target.value)}
            maxLength={60}
          />
          <p className="form-help">
            Give your session a memorable name.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-input"
            placeholder="Any details players should know — dress code, after-session plans, etc."
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
            maxLength={500}
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
          />
          <p className="form-help">{data.description.length}/500</p>
        </div>

        <div className="form-group">
          <label className="form-label">Game Format</label>
          <div className="format-card-list">
            <FormatCard
              active={data.format === "americano"}
              onSelect={() => setField("format", "americano")}
              emoji="🔄"
              title="Americano"
              sub="Partners rotate each round — everyone plays with everyone."
            />
            <FormatCard
              active={data.format === "mexicano"}
              onSelect={() => setField("format", "mexicano")}
              emoji="📊"
              title="Mexicano"
              sub="Pairing by ranking — each round matches similarly-ranked players."
            />
            <FormatCard
              active={data.format === "tournament"}
              onSelect={() => setField("format", "tournament")}
              emoji="🏆"
              title="Tournament"
              sub="Single elimination — winners advance, losers eliminated."
            />
          </div>
        </div>

      </section>
    </>
  );
}

function FormatCard({
  active,
  onSelect,
  emoji,
  title,
  sub,
}: {
  active: boolean;
  onSelect: () => void;
  emoji: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`format-card ${active ? "active" : ""}`}
      aria-pressed={active}
    >
      <div className="fc-emoji">{emoji}</div>
      <div className="fc-content">
        <div className="fc-title">{title}</div>
        <div className="fc-sub">{sub}</div>
      </div>
      <div className="fc-radio" aria-hidden>
        {active && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Step 2 — Location & Time
// ============================================================

function Step2Location({
  data,
  setField,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Location & Time</h2>

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
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3>Venue & Schedule</h3>
        </div>
        <div className="form-group">
          <label className="form-label">
            Venue / Court <span className="req">*</span>
          </label>
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
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="GBK Padel Court"
              value={data.venueName}
              onChange={(e) => setField("venueName", e.target.value)}
              maxLength={80}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Google Maps Link (Optional)</label>
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
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input
              type="url"
              className="form-input"
              placeholder="https://maps.app.goo.gl/..."
              value={data.mapsUrl}
              onChange={(e) => setField("mapsUrl", e.target.value)}
            />
          </div>
          {data.mapsUrl && (
            <div className="map-preview">
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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Link will be shared with players when inviting via WhatsApp.</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Date <span className="req">*</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={data.date}
            onChange={(e) => setField("date", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Start Time <span className="req">*</span>
            </label>
            <input
              type="time"
              className="form-input"
              value={data.timeStart}
              onChange={(e) => setField("timeStart", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              className="form-input"
              value={data.timeEnd}
              onChange={(e) => setField("timeEnd", e.target.value)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 3 — Players & Format
// ============================================================

function Step3Players({
  data,
  setField,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Players & Match Format</h2>

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">Number of Courts</label>
          <div className="chip-group">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${data.numCourts === n ? "active" : ""}`}
                onClick={() => setField("numCourts", n)}
              >
                {n} Court{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 12px",
            background: "var(--primary-50)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--primary-100)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--primary-700)", flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <path d="M16 11h6M19 8v6" />
          </svg>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--primary-700)",
              lineHeight: 1.5,
            }}
          >
            No maximum player limit. Add players via WhatsApp invite
            — anytime before/during the session.
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head">
          <div className="sec-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </div>
          <h3>Number of Rounds</h3>
        </div>

        <div className="form-group">
          <div className="segmented">
            <button
              type="button"
              className={`segmented-option ${data.roundMode === "auto" ? "active" : ""}`}
              onClick={() => setField("roundMode", "auto")}
            >
              <span>Auto</span>
              <span className="seg-sub">Auto-calculate</span>
            </button>
            <button
              type="button"
              className={`segmented-option ${data.roundMode === "manual" ? "active" : ""}`}
              onClick={() => setField("roundMode", "manual")}
            >
              <span>Manual</span>
              <span className="seg-sub">Set manually</span>
            </button>
          </div>
          {data.roundMode === "manual" && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() =>
                    setField("roundCount", Math.max(1, data.roundCount - 1))
                  }
                >
                  −
                </button>
                <div className="stepper-value">{data.roundCount}</div>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() =>
                    setField("roundCount", Math.min(30, data.roundCount + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sprint 52: Fix Partners toggle */}
        <div className="form-group" style={{ marginTop: 12 }}>
          <div className="toggle-row">
            <div className="toggle-info">
              <div className="form-label">Fix Partners</div>
              <p className="form-help">
                {data.fixPartners
                  ? "Pre-assign teams. After creating, set the pairs before generating Round 1."
                  : "System rotates partners each round (default Americano/Mexicano)."}
              </p>
            </div>
            <button
              type="button"
              className={`toggle ${data.fixPartners ? "on" : ""}`}
              onClick={() => setField("fixPartners", !data.fixPartners)}
              aria-pressed={data.fixPartners}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 12px",
            background: "var(--primary-50)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--primary-100)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--primary-700)", flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--primary-700)",
              lineHeight: 1.5,
            }}
          >
            Match has no point/time limit. Host or co-host decides
            when matches end during scoring.
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 4 — Visibility & Co-Host
// ============================================================

function Step4Visibility({
  data,
  setField,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Visibility & Co-Host</h2>

      <section className="form-section">
        <div className="form-section-head">
          <div className="sec-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            </svg>
          </div>
          <h3>Visibility</h3>
        </div>

        <div className="form-group">
          <div className="segmented">
            <button
              type="button"
              className={`segmented-option ${data.visibility === "private" ? "active" : ""}`}
              onClick={() => setField("visibility", "private")}
            >
              <span>🔒 Private</span>
              <span className="seg-sub">Invite only</span>
            </button>
            <button
              type="button"
              className={`segmented-option ${data.visibility === "public" ? "active" : ""}`}
              onClick={() => setField("visibility", "public")}
            >
              <span>🌍 Public</span>
              <span className="seg-sub">Discoverable</span>
            </button>
          </div>
          <p className="form-help">
            {data.visibility === "public"
              ? "Session shows up in Find Session for padel players — anyone can join directly."
              : "Only players who get the WA link can join."}
          </p>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head">
          <div className="sec-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <circle cx="17" cy="7" r="3" />
              <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          </div>
          <h3>Co-Host & Host Settings</h3>
        </div>

        <div className="toggle-row">
          <div className="toggle-info">
            <div className="form-label">I will play</div>
            <p className="form-help">
              Disable if youre just organizer/referee.
            </p>
          </div>
          <button
            type="button"
            className={`toggle ${data.hostIsPlaying ? "on" : ""}`}
            onClick={() => setField("hostIsPlaying", !data.hostIsPlaying)}
            aria-pressed={data.hostIsPlaying}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            background: "var(--bg-soft)",
            border: "1.5px dashed var(--border)",
            borderRadius: "var(--r-md)",
            fontSize: 12,
            color: "var(--text-600)",
            fontWeight: 600,
          }}
        >
          ℹ️ Co-Host can be assigned later from the session detail page after
          adding players.
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 5 — Review
// ============================================================

function Step5Review({
  data,
  goToStep,
}: {
  data: FormData;
  goToStep: (s: number) => void;
}) {
  const dateLabel = useMemo(() => {
    if (!data.date) return "—";
    const dt = new Date(`${data.date}T${data.timeStart || "00:00"}`);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  }, [data.date, data.timeStart]);

  const timeLabel = data.timeEnd
    ? `${data.timeStart} – ${data.timeEnd}`
    : data.timeStart;

  return (
    <>
      <h2 className="wizard-step-title">Review & Create</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
        }}
      >
        Review details before creating. Tap edit to modify.
      </p>

      <div className="review-card">
        <div className="review-section">
          <div className="review-info">
            <div className="review-label">Session Info</div>
            <div className="review-value">{data.name || "—"}</div>
            <div className="review-value-list" style={{ marginTop: 4 }}>
              <span>
                {data.format === "americano"
                  ? "Americano"
                  : data.format === "mexicano"
                    ? "Mexicano"
                    : "Tournament"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="review-edit"
            onClick={() => goToStep(1)}
          >
            Edit
          </button>
        </div>

        <div className="review-section">
          <div className="review-info">
            <div className="review-label">Location & Time</div>
            <div className="review-value">{data.venueName || "—"}</div>
            <div className="review-value-list" style={{ marginTop: 4 }}>
              <span>
                {dateLabel} · {timeLabel}
              </span>
              <span
                style={{
                  color: data.mapsUrl
                    ? "var(--primary-700)"
                    : "var(--text-500)",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                📍{" "}
                {data.mapsUrl
                  ? "Maps link added"
                  : "Maps link not added"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="review-edit"
            onClick={() => goToStep(2)}
          >
            Edit
          </button>
        </div>

        <div className="review-section">
          <div className="review-info">
            <div className="review-label">Court & Round</div>
            <div className="review-value">
              {data.numCourts} court{data.numCourts > 1 ? "s" : ""}
            </div>
            <div className="review-value-list" style={{ marginTop: 4 }}>
              <span>
                {data.roundMode === "auto"
                  ? "Auto round count"
                  : `${data.roundCount} round (manual)`}
              </span>
              <span style={{ color: "var(--text-500)" }}>
                No player limit · manual match end
              </span>
            </div>
          </div>
          <button
            type="button"
            className="review-edit"
            onClick={() => goToStep(3)}
          >
            Edit
          </button>
        </div>

        <div className="review-section">
          <div className="review-info">
            <div className="review-label">Visibility & Host</div>
            <div className="review-value">
              {data.visibility === "public"
                ? "🌍 Public — discoverable"
                : "🔒 Private — invite only"}
            </div>
            <div className="review-value-list" style={{ marginTop: 4 }}>
              <span>
                {data.hostIsPlaying
                  ? "Host (you) playing"
                  : "Host is organizer only (not playing)"}
              </span>
              <span style={{ color: "var(--text-500)" }}>No co-host yet</span>
            </div>
          </div>
          <button
            type="button"
            className="review-edit"
            onClick={() => goToStep(4)}
          >
            Edit
          </button>
        </div>
      </div>

      <div
        style={{
          background: "var(--primary-50)",
          border: "1px solid var(--primary-100)",
          borderRadius: "var(--r-md)",
          padding: 14,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
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
          style={{ color: "var(--primary-700)", flexShrink: 0, marginTop: 2 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--primary-700)",
              marginBottom: 2,
            }}
          >
            After creation:
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-700)",
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            Session will appear in &quot;My Sessions&quot;. You can invite
            players via WhatsApp link & manage matches inside the session.
          </div>
        </div>
      </div>
    </>
  );
}
