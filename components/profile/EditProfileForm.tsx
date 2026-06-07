"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/app/actions/profile";

type Props = {
  initialDisplayName: string;
  initialCity: string;
  initialVisibility?: "public" | "friends" | "private";
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

export function EditProfileForm({
  initialDisplayName,
  initialCity,
  initialVisibility = "public",
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [city, setCity] = useState(initialCity);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [customCity, setCustomCity] = useState(
    !!initialCity && !POPULAR_CITIES.some((c) => c.name === initialCity)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);

    if (displayName.trim().length < 2 || displayName.trim().length > 30) {
      setError("Nama harus 2-30 karakter");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("display_name", displayName.trim());
      fd.set("city", city.trim());
      fd.set("profile_visibility", visibility);
      const result = await updateProfileAction(null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/profile");
        router.refresh();
      }
    });
  }

  return (
    <>
      <main className="app-content subscreen with-footer">
        {/* Name */}
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
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
            />
            <p className="form-help">2-30 karakter. Visible ke pemain lain.</p>
          </div>
        </section>

        {/* City */}
        <section className="form-section">
          <div className="form-group">
            <label className="form-label">City</label>
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
                      setCustomCity(false);
                      setCity(c.name);
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
                setCustomCity(true);
                if (POPULAR_CITIES.some((c) => c.name === city)) setCity("");
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
                onChange={(e) => setCity(e.target.value)}
                maxLength={50}
              />
            )}
          </div>
        </section>

        {/* Privacy (Sprint 24) */}
        <section className="form-section">
          <div className="form-group">
            <label className="form-label">Privacy Profile</label>
            <div className="segmented" style={{ flexWrap: "wrap" }}>
              {(
                [
                  { v: "public", label: "🌍 Public", sub: "Siapa pun" },
                  { v: "friends", label: "👥 Friends", sub: "Friend saja" },
                  { v: "private", label: "🔒 Private", sub: "Hanya kamu" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  className={`segmented-option ${
                    visibility === opt.v ? "active" : ""
                  }`}
                  onClick={() => setVisibility(opt.v)}
                >
                  <span>{opt.label}</span>
                  <span className="seg-sub">{opt.sub}</span>
                </button>
              ))}
            </div>
            <p className="form-help">
              Atur siapa yang bisa lihat profile kamu di /u/[id].
            </p>
          </div>
        </section>

        {error && (
          <div
            style={{
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
      </main>

      <div className="sticky-footer">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || displayName.trim().length < 2}
          className={`btn-primary-lg ${isPending ? "loading" : ""}`}
        >
          <span>{isPending ? "Menyimpan..." : "Save Changes"}</span>
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
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
