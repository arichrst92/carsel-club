/**
 * Next.js root middleware — route protection via custom session cookie.
 * Runs on Edge Runtime (must use session-core, not session.ts).
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session-core";

// Public routes — accessible without auth
const PUBLIC_EXACT = [
  "/",
  "/login",
  "/login/verify",
  // Sprint 33: PWA assets must be public
  "/manifest.webmanifest",
  "/sw.js",
  "/offline",
  // Sprint 37: legal pages must be public
  "/help",
  "/privacy-policy",
  "/tos",
];
const PUBLIC_PREFIXES = [
  "/s/", // public share (live view)
  "/invite/", // referral landing
  "/api/", // API routes self-gate via requireUser
  "/uploads/", // uploaded files
];

function isPublic(path: string): boolean {
  if (PUBLIC_EXACT.includes(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Authed user hitting login → redirect to home
  if (session && (path === "/login" || path === "/login/verify")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Unauthed user hitting protected route → redirect to login
  if (!session && !isPublic(path)) {
    const url = new URL("/login", request.url);
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)",
  ],
};
