"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  verifyOtpAction,
  sendOtpAction,
} from "@/app/actions/auth";

const OTP_LENGTH = 6;
const RESEND_SECS = 59;

function formatPhoneForDisplay(phone: string): string {
  if (!phone.startsWith("62")) return phone;
  return `+62 ${phone.slice(2)}`;
}

export function OtpForm({ phone }: { phone: string }) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [resendSecs, setResendSecs] = useState(RESEND_SECS);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  const allFilled = digits.every((d) => d !== "");

  function setDigit(idx: number, value: string) {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((curr) => {
      const next = [...curr];
      next[idx] = v;
      return next;
    });

    if (v && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && !isPending) {
      const code = digits.join("");
      void submit(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits.join("")]);

  function handleKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      setDigits((curr) => {
        const next = [...curr];
        next[idx - 1] = "";
        return next;
      });
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = text.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
    setDigits(next);
    const lastIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  }

  async function submit(code: string) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("phone", phone);
      formData.set("code", code);
      const result = await verifyOtpAction(null, formData);
      if (result?.error) {
        setError(result.error);
        // Clear digits on error so user can retry
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    });
  }

  function handleSubmitClick() {
    if (!allFilled) return;
    void submit(digits.join(""));
  }

  function handleResend() {
    if (resendSecs > 0 || isPending) return;
    setError(null);
    setResendInfo(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("phone", phone);
      const result = await sendOtpAction(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setResendInfo("OTP baru dikirim ke WhatsApp");
        setResendSecs(RESEND_SECS);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    });
  }

  return (
    <>
      <main className="app-content subscreen with-footer">
        <div className="auth-step">
          <div
            className="auth-icon-hero"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), var(--primary-600))",
              boxShadow: "0 12px 28px rgba(20,184,166,0.4)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M9 10h.01M13 10h.01M17 10h.01" />
            </svg>
          </div>
          <h2 className="auth-step-title">Cek WhatsApp Kamu</h2>
          <p className="auth-step-sub">
            Kami baru saja kirim 6-digit kode ke{" "}
            <strong>{formatPhoneForDisplay(phone)}</strong>.
          </p>

          <div
            className="otp-input-row"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
              maxWidth: 320,
              margin: "0 auto var(--s-4)",
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="tel"
                inputMode="numeric"
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => setDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`otp-box ${digit ? "filled" : ""}`}
                aria-label={`OTP digit ${idx + 1}`}
                style={{
                  aspectRatio: "1",
                  width: "100%",
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "var(--font-display)",
                  background: digit ? "var(--primary-50)" : "var(--bg)",
                  border: `2px solid ${
                    digit ? "var(--primary-200)" : "var(--border)"
                  }`,
                  borderRadius: "var(--r-md)",
                  outline: "none",
                  color: "var(--text-900)",
                  transition: "all 0.15s",
                  padding: 0,
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>

          {error && (
            <div
              style={{
                margin: "var(--s-3) auto 0",
                maxWidth: 340,
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
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            </div>
          )}

          <div className="resend-row">
            {resendSecs > 0 ? (
              <p>
                Belum dapat kode?{" "}
                <span className="timer">
                  Kirim ulang dalam 0:
                  {String(resendSecs).padStart(2, "0")}
                </span>
              </p>
            ) : (
              <p>
                Belum dapat kode?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleResend();
                  }}
                >
                  Kirim ulang OTP
                </a>
              </p>
            )}
            {resendInfo && (
              <p style={{ color: "var(--primary-700)", marginTop: 4 }}>
                {resendInfo}
              </p>
            )}
          </div>
        </div>
      </main>

      <div className="sticky-footer">
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={!allFilled || isPending}
          className={`btn-primary-lg ${isPending ? "loading" : ""}`}
        >
          <span>{isPending ? "Memverifikasi..." : "Verifikasi"}</span>
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
