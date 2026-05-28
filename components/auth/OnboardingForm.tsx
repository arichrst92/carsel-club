"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/app/actions/auth";

type Props = {
  initialDisplayName?: string;
  initialCity?: string;
};

const POPULAR_CITIES = [
  { name: "Jakarta", emoji: "🏙️" },
  { name: "Bandung", emoji: "⛰️" },
  { name: "Surabaya", emoji: "🛳️" },
  { name: "Bali", emoji: "🌴" },
  { name: "Yogyakarta", emoji: "🛕" },
  { name: "Medan", emoji: "🌳" },
  { name: "Semarang", emoji: "🏯" },
  { name: "Makassar", emoji: "🌊" },
];

export function OnboardingForm({
  initialDisplayName = "",
  initialCity = "",
}: Props) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [city, setCity] = useState(initialCity);
  const [customCity, setCustomCity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const TOTAL_STEPS = 3;
  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  function nextStep() {
    setError(null);
    if (step === 1) {
      if (displayName.trim().length < 2) {
        setError("Nama minimal 2 karakter");
        return;
      }
      if (displayName.trim().length > 30) {
        setError("Nama maksimal 30 karakter");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // City optional
      setStep(3);
    } else {
      submit();
    }
  }

  function prevStep() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  function submit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("display_name", displayName.trim());
      fd.set("city", city.trim());
      const result = await completeOnboardingAction(null, fd);
      if (result?.error) setError(result.error);
    });
  }

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

        <div className="wizard-step active">
          {step === 1 && (
            <Step1Name
              displayName={displayName}
              onChange={setDisplayName}
              initial={initial}
            />
          )}
          {step === 2 && (
            <Step2City
              city={city}
              onChange={setCity}
              customCity={customCity}
              onToggleCustom={setCustomCity}
            />
          )}
          {step === 3 && (
            <Step3Preview
              displayName={displayName}
              city={city}
              initial={initial}
            />
          )}
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

      {/* Footer */}
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
          <div />
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
                ? "Menyimpan..."
                : "Mulai Main"
              : "Next"}
          </span>
          {!isPending && (
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
        </button>
      </div>
    </>
  );
}

// ============================================================
// Step 1 — Name + Avatar
// ============================================================

function Step1Name({
  displayName,
  onChange,
  initial,
}: {
  displayName: string;
  onChange: (v: string) => void;
  initial: string;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Halo! Siapa namamu?</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        Ini akan jadi identitas kamu di Carsel Club. Bisa nama asli atau
        nickname.
      </p>

      {/* Avatar preview */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "var(--s-5)",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FB7185, #F43F5E)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 40,
            boxShadow: "var(--shadow-md)",
            border: "4px solid var(--bg)",
          }}
        >
          {initial}
        </div>
      </div>

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">
            Nama Display <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Ari Christian"
            value={displayName}
            onChange={(e) => onChange(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <p className="form-help">
            Maksimum 30 karakter. Bisa diubah nanti.
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 2 — City
// ============================================================

function Step2City({
  city,
  onChange,
  customCity,
  onToggleCustom,
}: {
  city: string;
  onChange: (v: string) => void;
  customCity: boolean;
  onToggleCustom: (v: boolean) => void;
}) {
  const isPopular = POPULAR_CITIES.some((c) => c.name === city);

  return (
    <>
      <h2 className="wizard-step-title">Di mana kamu main?</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        Pilih kota domisili — penting untuk Regional Leaderboard di v1.5
        nanti. (Optional)
      </p>

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">Pilih Kota</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {POPULAR_CITIES.map((c) => {
              const selected = !customCity && city === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onToggleCustom(false);
                    onChange(c.name);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                    background: selected ? "var(--primary-50)" : "var(--bg)",
                    border: `1.5px solid ${
                      selected ? "var(--primary)" : "var(--border)"
                    }`,
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: selected
                        ? "var(--primary-700)"
                        : "var(--text-900)",
                    }}
                  >
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <button
            type="button"
            onClick={() => {
              onToggleCustom(true);
              if (isPopular) onChange("");
            }}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: customCity ? "var(--primary-50)" : "var(--bg-soft)",
              border: `1.5px dashed ${
                customCity ? "var(--primary)" : "var(--border)"
              }`,
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: customCity ? "var(--primary-700)" : "var(--text-700)",
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            {customCity ? "✓ Custom city aktif" : "+ Kota lain (custom)"}
          </button>

          {customCity && (
            <input
              type="text"
              className="form-input"
              placeholder="Ketik nama kota kamu"
              value={city}
              onChange={(e) => onChange(e.target.value)}
              maxLength={50}
              autoFocus
            />
          )}
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 3 — Preview / Confirm
// ============================================================

function Step3Preview({
  displayName,
  city,
  initial,
}: {
  displayName: string;
  city: string;
  initial: string;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Ready to play! 🎾</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        Cek profil kamu di bawah. Tap Back kalau mau ubah, atau Mulai Main.
      </p>

      {/* Preview card */}
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
          color: "#fff",
          borderRadius: "var(--r-2xl)",
          padding: "var(--s-5)",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
          marginBottom: "var(--s-4)",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto var(--s-3)",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 40,
            border: "4px solid rgba(255,255,255,0.4)",
          }}
        >
          {initial}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            marginBottom: 4,
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            fontSize: 13,
            opacity: 0.9,
            fontWeight: 600,
          }}
        >
          {city ? `📍 ${city}` : "Belum set kota"}
        </div>
        <div
          style={{
            marginTop: "var(--s-3)",
            padding: "6px 14px",
            background: "rgba(255,255,255,0.22)",
            borderRadius: "var(--r-full)",
            display: "inline-block",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          🥚 Rookie · 0 pts
        </div>
      </section>

      <div
        style={{
          padding: "var(--s-3)",
          background: "var(--bg-soft)",
          border: "1px dashed var(--border)",
          borderRadius: "var(--r-md)",
          fontSize: 12,
          color: "var(--text-700)",
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        💡 Tip: Setelah klik &quot;Mulai Main&quot;, kamu bisa langsung create
        session padel pertama atau join via invite link teman.
      </div>
    </>
  );
}
