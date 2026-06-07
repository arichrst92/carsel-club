"use client";

import { useState, useTransition } from "react";
import { sendOtpAction } from "@/app/actions/auth";

export function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (phone.length < 9) {
      setError("Enter a valid WhatsApp number");
      return;
    }
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("phone", phone);
      const result = await sendOtpAction(null, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">WhatsApp Number</label>
        <div className="phone-input-row">
          <button type="button" className="country-pill">
            <span className="flag">🇮🇩</span>
            <span>+62</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="form-input"
            placeholder="81234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <p className="form-help">Number must have active WhatsApp to receive the OTP.</p>

        {error && (
          <div
            style={{
              marginTop: 12,
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
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || phone.length < 9}
        className="btn-whatsapp"
        style={{ width: "100%", border: "none", cursor: "pointer" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span>{isPending ? "Sending OTP..." : "Continue with WhatsApp"}</span>
      </button>
    </div>
  );
}
