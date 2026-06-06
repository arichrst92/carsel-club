/**
 * Guest session cookie helpers (Sprint 19).
 *
 * Track participantId untuk guest user yang join via /s/[id]/guest.
 * Cookie format: JSON array of { sessionId, participantId, name }, max 5 entries.
 * TTL 24 jam.
 *
 * Tidak ada auth check — pure cookie state. Server tetap validate
 * participant exists saat read.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "carsel_guest";
const MAX_SESSIONS = 5;
const TTL_SECONDS = 24 * 60 * 60;

export type GuestSessionEntry = {
  sessionId: string;
  participantId: string;
  name: string;
};

export async function getGuestSessions(): Promise<GuestSessionEntry[]> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is GuestSessionEntry =>
        e &&
        typeof e.sessionId === "string" &&
        typeof e.participantId === "string" &&
        typeof e.name === "string"
    );
  } catch {
    return [];
  }
}

export async function getGuestSessionFor(
  sessionId: string
): Promise<GuestSessionEntry | null> {
  const all = await getGuestSessions();
  return all.find((e) => e.sessionId === sessionId) ?? null;
}

export async function addGuestSession(
  entry: GuestSessionEntry
): Promise<void> {
  const c = await cookies();
  const all = await getGuestSessions();
  // Remove existing entry for sessionId (replace) lalu prepend
  const filtered = all.filter((e) => e.sessionId !== entry.sessionId);
  const updated = [entry, ...filtered].slice(0, MAX_SESSIONS);
  c.set(COOKIE_NAME, JSON.stringify(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SECONDS,
    path: "/",
  });
}

export async function clearGuestSession(sessionId: string): Promise<void> {
  const c = await cookies();
  const all = await getGuestSessions();
  const filtered = all.filter((e) => e.sessionId !== sessionId);
  if (filtered.length === 0) {
    c.delete(COOKIE_NAME);
  } else {
    c.set(COOKIE_NAME, JSON.stringify(filtered), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TTL_SECONDS,
      path: "/",
    });
  }
}
