/**
 * Referral cookie management.
 * Track who invited a new user during signup.
 */

import { cookies } from "next/headers";

const REFERRER_COOKIE = "carsel_ref";
const REFERRER_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function setReferrerCookie(referrerUserId: string): Promise<void> {
  const c = await cookies();
  c.set(REFERRER_COOKIE, referrerUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFERRER_MAX_AGE,
    path: "/",
  });
}

export async function getReferrerCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(REFERRER_COOKIE)?.value ?? null;
}

export async function clearReferrerCookie(): Promise<void> {
  const c = await cookies();
  c.delete(REFERRER_COOKIE);
}
