"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  verifyOtpAction,
  sendOtpAction,
  type AuthActionState,
} from "@/app/actions/auth";

export function OtpForm({ phone }: { phone: string }) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    verifyOtpAction,
    null
  );

  return (
    <>
      <form action={formAction} className="w-full max-w-xs space-y-4">
        <input type="hidden" name="phone" value={phone} />

        <div>
          <label
            htmlFor="code"
            className="block text-xs font-bold text-text-700 mb-2 uppercase tracking-wide text-center"
          >
            Kode OTP
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            required
            autoFocus
            placeholder="• • • • • •"
            className="w-full px-4 py-4 rounded-xl border border-border text-center text-2xl font-display font-bold tracking-[0.5em] bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
          />
        </div>

        {state?.error && (
          <div className="px-3 py-2 rounded-lg bg-accent-50 border border-accent-100">
            <p className="text-xs text-accent-600 font-semibold">
              {state.error}
            </p>
          </div>
        )}

        <SubmitButton />
      </form>

      <ResendButton phone={phone} />
    </>
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
      {pending ? "Memverifikasi..." : "Verifikasi"}
    </button>
  );
}

function ResendButton({ phone }: { phone: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  function handleResend() {
    setMessage("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("phone", phone);
      const result = await sendOtpAction(null, formData);
      // sendOtpAction redirects on success — only reached on error
      if (result?.error) {
        setMessage(result.error);
      } else {
        setMessage("OTP terkirim ulang");
      }
    });
  }

  return (
    <div className="text-center space-y-1">
      <button
        type="button"
        onClick={handleResend}
        disabled={isPending}
        className="text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 underline"
      >
        {isPending ? "Mengirim ulang..." : "Kirim ulang kode"}
      </button>
      {message && <p className="text-xs text-text-500">{message}</p>}
    </div>
  );
}
