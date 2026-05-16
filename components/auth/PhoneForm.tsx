"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendOtpAction, type AuthActionState } from "@/app/actions/auth";

export function PhoneForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    sendOtpAction,
    null
  );

  return (
    <form action={formAction} className="w-full max-w-xs space-y-4">
      <div>
        <label
          htmlFor="phone"
          className="block text-xs font-bold text-text-700 mb-2 uppercase tracking-wide"
        >
          Nomor WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="08123456789"
          className="w-full px-4 py-3 rounded-xl border border-border text-base bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
        />
        <p className="mt-1.5 text-xs text-text-500">
          Format: 08xxx atau 628xxx
        </p>
      </div>

      {state?.error && (
        <div className="px-3 py-2 rounded-lg bg-accent-50 border border-accent-100">
          <p className="text-xs text-accent-600 font-semibold">{state.error}</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-primary-500 text-white font-display font-bold text-base shadow-fab disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary-600 active:scale-[0.98] transition"
    >
      {pending ? "Mengirim..." : "Kirim Kode OTP"}
    </button>
  );
}
