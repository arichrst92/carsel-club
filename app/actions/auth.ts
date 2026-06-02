"use server";

/**
 * Auth Server Actions — OTP send, verify, logout, onboarding.
 * Uses Drizzle ORM (postgres-js).
 */

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { otpVerifications, referrals, users } from "@/lib/db/schema";
import {
  clearReferrerCookie,
  getReferrerCookie,
} from "@/lib/auth/referral";
import {
  normalizePhone,
  isValidIndonesianPhone,
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  computeOtpExpiry,
  OTP_CONFIG,
} from "@/lib/auth/otp";
import { sendOtp } from "@/lib/fonnte/client";
import {
  createSession,
  destroySession,
  getSession,
} from "@/lib/auth/session";
import { checkOtpRequestRate } from "@/lib/auth/rate-limit";
import { event } from "@/lib/log";

export type AuthActionState = { error?: string } | null;

// ============================================================
// 1. Send OTP
// ============================================================

export async function sendOtpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawPhone = String(formData.get("phone") ?? "").trim();
  if (!rawPhone) return { error: "Nomor WhatsApp wajib diisi" };

  const phone = normalizePhone(rawPhone);
  if (!isValidIndonesianPhone(phone)) {
    return { error: "Nomor WhatsApp Indonesia tidak valid" };
  }

  // Rate limit
  const rate = await checkOtpRequestRate(phone);
  if (!rate.ok) return { error: rate.reason };

  // Generate + store OTP
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = computeOtpExpiry();

  try {
    await db.insert(otpVerifications).values({
      whatsappNumber: phone,
      codeHash,
      expiresAt,
    });
  } catch (e) {
    console.error("[sendOtpAction] insert error:", e);
    return { error: "Gagal menyimpan OTP. Coba lagi." };
  }

  // Send via Fonnte (or dev fallback to console)
  try {
    const res = await sendOtp(phone, code);
    if (!res.status) {
      console.error("[sendOtpAction] Fonnte returned status=false:", res);
      return {
        error: "Gagal kirim OTP ke WhatsApp. Pastikan nomor benar & aktif.",
      };
    }
  } catch (e) {
    console.error("[sendOtpAction] Fonnte exception:", e);
    return { error: "Gagal kirim OTP. Coba lagi sebentar." };
  }

  redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
}

// ============================================================
// 2. Verify OTP — checks code, creates session
// ============================================================

export async function verifyOtpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const phone = normalizePhone(rawPhone);
  if (!isValidIndonesianPhone(phone)) {
    return { error: "Nomor tidak valid. Mulai ulang." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Kode OTP harus 6 digit angka" };
  }

  // Find latest non-verified, non-expired OTP
  const [otp] = await db
    .select()
    .from(otpVerifications)
    .where(
      and(
        eq(otpVerifications.whatsappNumber, phone),
        isNull(otpVerifications.verifiedAt),
        gte(otpVerifications.expiresAt, new Date())
      )
    )
    .orderBy(desc(otpVerifications.createdAt))
    .limit(1);

  if (!otp) {
    return {
      error: "Kode OTP tidak ditemukan atau sudah expired. Kirim ulang.",
    };
  }

  if (otp.attempts >= OTP_CONFIG.maxAttempts) {
    return { error: "Terlalu banyak percobaan. Kirim ulang OTP." };
  }

  // Verify code
  if (!verifyOtpCode(code, otp.codeHash)) {
    const newAttempts = otp.attempts + 1;
    await db
      .update(otpVerifications)
      .set({ attempts: newAttempts })
      .where(eq(otpVerifications.id, otp.id));

    const remaining = OTP_CONFIG.maxAttempts - newAttempts;
    return {
      error:
        remaining > 0
          ? `Kode salah. Sisa percobaan: ${remaining}`
          : "Terlalu banyak percobaan. Kirim ulang OTP.",
    };
  }

  // Mark verified
  await db
    .update(otpVerifications)
    .set({ verifiedAt: new Date() })
    .where(eq(otpVerifications.id, otp.id));

  // Find or create user
  const [existingUser] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
    })
    .from(users)
    .where(eq(users.whatsappNumber, phone))
    .limit(1);

  let userId: string;
  let isNewUser = false;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const placeholderName = `User ${phone.slice(-4)}`;
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          whatsappNumber: phone,
          displayName: placeholderName,
        })
        .returning({ id: users.id });
      userId = newUser.id;
      isNewUser = true;
    } catch (e) {
      console.error("[verifyOtpAction] user create error:", e);
      return { error: "Gagal membuat akun. Coba lagi." };
    }
  }

  // Referral attribution (new user only)
  if (isNewUser) {
    try {
      const referrerCode = await getReferrerCookie();
      if (referrerCode && referrerCode !== userId) {
        const [referrer] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, referrerCode))
          .limit(1);
        if (referrer) {
          await db.insert(referrals).values({
            code: nanoid(10),
            referrerUserId: referrer.id,
            referredUserId: userId,
            claimedAt: new Date(),
          });
          event("referral_claimed", { referrerUserId: referrer.id });
        }
      }
      await clearReferrerCookie();
    } catch (e) {
      // Don't fail signup over referral logging
      console.warn("[verifyOtpAction] referral attribution failed:", e);
    }
  }

  // Issue session
  await createSession(userId);

  // Track signup vs login
  if (isNewUser) {
    event("signup", { phone });
  } else {
    event("login", { phone });
  }

  const needsOnboarding =
    isNewUser ||
    (existingUser?.displayName?.startsWith("User ") &&
      existingUser?.displayName?.length === 9);

  redirect(needsOnboarding ? "/onboarding" : "/home");
}

// ============================================================
// 3. Logout
// ============================================================

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ============================================================
// 4. Complete onboarding
// ============================================================

export async function completeOnboardingAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const cityRaw = String(formData.get("city") ?? "").trim();
  const city = cityRaw.length > 0 ? cityRaw : null;

  if (displayName.length < 2 || displayName.length > 30) {
    return { error: "Nama harus 2-30 karakter" };
  }
  if (city && city.length > 50) {
    return { error: "Nama kota maksimal 50 karakter" };
  }

  try {
    await db
      .update(users)
      .set({ displayName, city, updatedAt: new Date() })
      .where(eq(users.id, session!.userId));
  } catch (e) {
    console.error("[completeOnboardingAction] update error:", e);
    return { error: "Gagal update profil. Coba lagi." };
  }

  redirect("/home");
}
