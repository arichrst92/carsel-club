import { PhoneForm } from "@/components/auth/PhoneForm";

export const metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div className="auth-shell">
      {/* HERO */}
      <section className="auth-hero">
        <div className="auth-brand">
          <div className="auth-brand-mark">CC</div>
          <div className="auth-brand-text">Carsel Club</div>
        </div>

        <h1 className="auth-hero-title">
          Padel community
          <br />
          <span className="highlight">all-in-one</span> tool.
        </h1>
        <p className="auth-hero-sub">
          Atur session, scoring, leaderboard, dan share match — semua di satu
          tempat. Buat circle padelmu makin seru.
        </p>

        {/* Decorative floating cards */}
        <div className="auth-decoration">
          <div className="auth-mock-card card-1">
            <div className="amc-emoji">🎾</div>
            <div className="amc-text">
              Sabtu Sore Padel
              <small>LIVE · Round 3</small>
            </div>
          </div>
          <div className="auth-mock-card card-2">
            <div className="amc-emoji">🏆</div>
            <div className="amc-text">
              Tier Up!
              <small>Intermediate → Advanced</small>
            </div>
          </div>
          <div className="auth-mock-card card-3">
            <div className="amc-emoji">📊</div>
            <div className="amc-text">
              +18 pts
              <small>Match win streak 3</small>
            </div>
          </div>
        </div>
      </section>

      {/* AUTH CARD (slides up over hero) */}
      <section className="auth-card">
        <div className="auth-card-title">Mulai Bermain</div>
        <div className="auth-card-sub">Free untuk circle padelmu sendiri</div>

        <PhoneForm />

        <div
          style={{
            marginTop: "var(--s-3)",
            padding: "10px 12px",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-md)",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
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
            style={{ color: "#25D366", flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-600)",
              lineHeight: 1.4,
            }}
          >
            Verifikasi cepat via WhatsApp OTP. Kami akan kirim 6-digit kode ke
            nomor WA kamu.
          </div>
        </div>

        <div className="auth-tos">
          Dengan lanjut, kamu setuju dengan
          <br />
          <a href="#tos">Terms of Service</a> &{" "}
          <a href="#privacy">Privacy Policy</a>
        </div>
      </section>
    </div>
  );
}
