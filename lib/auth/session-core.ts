/**
 * Session token sign/verify (Edge-compatible).
 *
 * Shared logic between Server Components (lib/auth/session.ts) and
 * Edge Middleware (middleware.ts). Uses jose for HS256 JWT.
 */

import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "carsel_session";
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SESSION_SECRET must be set and >= 32 characters. Generate: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
} as const;
