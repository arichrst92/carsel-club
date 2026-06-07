import Image from "next/image";
import { PhoneForm } from "@/components/auth/PhoneForm";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="auth-shell">
      {/* HERO */}
      <section className="auth-hero">
        <div
          className="auth-brand"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Image
            src="/full-logo.png"
            alt="Carsel Club"
            width={180}
            height={180}
            priority
            style={{ display: "block", marginBottom: 16 }}
          />
        </div>

        <h1 className="auth-hero-title">
          Padel community
          <br />
          <span className="highlight">all-in-one</span> tool.
        </h1>
        <p className="auth-hero-sub">
          Organize sessions, scoring, leaderboards, and share matches — all in
          one place. Make your padel circle more fun.
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
        <div className="auth-card-title">Get Started</div>
        <div className="auth-card-sub">Free for your padel circle</div>

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
            Quick verification via WhatsApp OTP. We'll send a 6-digit code to
            your WA number.
          </div>
        </div>

        <div className="auth-tos">
          By continuing, you agree to our
          <br />
          <a href="/tos">Terms & Conditions</a> &{" "}
          <a href="/privacy-policy">Privacy Policy</a>
        </div>
      </section>
    </div>
  );
}
