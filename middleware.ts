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
const PUBLIC_EXACT = ["/", "/login", "/login/verify"];
const PUBLIC_PREFIXES = ["/s/"]; // /s/* = public session share

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
