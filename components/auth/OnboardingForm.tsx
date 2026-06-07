"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/app/actions/auth";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import {
  canAdvanceStep,
  BIO_MAX,
} from "@/lib/auth/onboarding";

type Props = {
  initialDisplayName?: string;
  initialCity?: string;
  initialBio?: string;
  initialAvatarUrl?: string | null;
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
  initialBio = "",
  initialAvatarUrl = null,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [city, setCity] = useState(initialCity);
  const [bio, setBio] = useState(initialBio);
  const [customCity, setCustomCity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const TOTAL_STEPS = 3;
  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  function nextStep() {
    setError(null);
    const v = canAdvanceStep({ step, displayName, city, bio });
    if (!v.ok) {
      setError(v.error);
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      submit();
    }
  }

  function prevStep() {
    setError(null);
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  }

  function submit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("display_name", displayName.trim());
      fd.set("city", city.trim());
      fd.set("bio", bio.trim());
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
              currentAvatarUrl={initialAvatarUrl}
            />
          )}
          {step === 2 && (
            <Step2CityBio
              city={city}
              onCityChange={setCity}
              bio={bio}
              onBioChange={setBio}
              customCity={customCity}
              onToggleCustom={setCustomCity}
            />
          )}
          {step === 3 && (
            <Step3Welcome
              displayName={displayName}
              city={city}
              bio={bio}
              initial={initial}
              avatarUrl={initialAvatarUrl}
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
                ? "Saving..."
                : "Start Playing"
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
  currentAvatarUrl,
}: {
  displayName: string;
  onChange: (v: string) => void;
  initial: string;
  currentAvatarUrl: string | null;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Hi! What's your name?</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        Choose a display name + upload a photo (optional). Can be changed later.
      </p>

      {/* Avatar uploader — uses existing avatar action */}
      <AvatarUploader
        currentAvatarUrl={currentAvatarUrl}
        initial={initial}
      />

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">
            Display Name <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Ari Christian"
            value={displayName}
            onChange={(e) => onChange(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <p className="form-help">
            Maximum 30 characters. Can be changed later.
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 2 — City
// ============================================================

function Step2CityBio({
  city,
  onCityChange,
  bio,
  onBioChange,
  customCity,
  onToggleCustom,
}: {
  city: string;
  onCityChange: (v: string) => void;
  bio: string;
  onBioChange: (v: string) => void;
  customCity: boolean;
  onToggleCustom: (v: boolean) => void;
}) {
  const isPopular = POPULAR_CITIES.some((c) => c.name === city);

  return (
    <>
      <h2 className="wizard-step-title">About you</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        City for the Regional Leaderboard, short bio for your public profile.
        Both optional — feel free to skip.
      </p>

      <section className="form-section">
        <div className="form-group">
          <label className="form-label">Choose City</label>
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
                    onCityChange(c.name);
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
              if (isPopular) onCityChange("");
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
            {customCity ? "✓ Custom city active" : "+ Other city (custom)"}
          </button>

          {customCity && (
            <input
              type="text"
              className="form-input"
              placeholder="Type your city name"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              maxLength={50}
              autoFocus
            />
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Short bio</label>
          <textarea
            className="form-input"
            placeholder="e.g. Padel addict. Weekend warrior. Better than AI on a court."
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            maxLength={BIO_MAX}
            rows={3}
            style={{
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
          <p className="form-help">
            {bio.length}/{BIO_MAX} characters · shown on your public profile
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Step 3 — Preview / Confirm
// ============================================================

// ============================================================
// Step 3 — Welcome + Tier intro
// ============================================================

const TIER_INTRO = [
  { emoji: "🥚", name: "Rookie", desc: "0 poin · starting tier" },
  { emoji: "🥉", name: "Bronze", desc: "150 pts, 25 match" },
  { emoji: "🥈", name: "Silver", desc: "350 pts, 60 match" },
  { emoji: "🥇", name: "Gold", desc: "600 pts, 110 match" },
  { emoji: "💎", name: "Platinum", desc: "850 pts, 170 match" },
  { emoji: "👑", name: "Master", desc: "1000 pts, 200+ match" },
];

function Step3Welcome({
  displayName,
  city,
  bio,
  initial,
  avatarUrl,
}: {
  displayName: string;
  city: string;
  bio: string;
  initial: string;
  avatarUrl: string | null;
}) {
  return (
    <>
      <h2 className="wizard-step-title">Welcome! 🎾</h2>
      <p
        style={{
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
          marginTop: -12,
          marginBottom: "var(--s-4)",
        }}
      >
        Profile is ready. Climb tiers by playing + winning — everything is tracked automatically.
      </p>

      {/* Profile preview card */}
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
            background: avatarUrl
              ? `url(${avatarUrl}) center/cover no-repeat`
              : "rgba(255,255,255,0.22)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 40,
            border: "4px solid rgba(255,255,255,0.4)",
          }}
        >
          {!avatarUrl && initial}
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
        <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
          {city ? `📍 ${city}` : "City not set"}
        </div>
        {bio && (
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
              fontWeight: 600,
              marginTop: 6,
              fontStyle: "italic",
              maxWidth: 280,
              margin: "6px auto 0",
            }}
          >
            "{bio}"
          </div>
        )}
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

      {/* Tier ladder intro */}
      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "var(--s-3) var(--s-4)",
          marginBottom: "var(--s-3)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 13,
            color: "var(--text-900)",
            marginBottom: "var(--s-2)",
          }}
        >
          🏆 Tier ladder
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TIER_INTRO.map((t, i) => (
            <div
              key={t.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-2)",
                fontSize: 12,
                fontWeight: 600,
                color:
                  i === 0 ? "var(--text-900)" : "var(--text-500)",
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>
                {t.emoji}
              </span>
              <span style={{ fontWeight: i === 0 ? 800 : 600 }}>
                {t.name}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11 }}>
                {t.desc}
              </span>
            </div>
          ))}
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
        💡 Tap &quot;Start Playing&quot; → opens home. You can create a
        session right away, or join via a friend's invite link.
      </div>
    </>
  );
}
