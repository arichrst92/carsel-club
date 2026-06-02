/**
 * Logger entrypoint — async writes ke DB + console fallback.
 *
 * Semua call adalah fire-and-forget — caller TIDAK await. Kalau DB write
 * gagal, error dialihkan ke console (tidak crash flow caller). Ini critical
 * supaya logger gak jadi single point of failure.
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

/**
 * SERVER-ONLY barrel. Jangan re-export pure utils dari sini —
 * kalau client component impor barrel ini, postgres + next/headers
 * ikut ke client bundle dan build crash.
 *
 * Client / pure imports langsung dari:
 *   - @/lib/log/format     untuk display helpers
 *   - @/lib/log/filter     untuk pure filter logic
 *   - @/lib/log/sanitize   untuk redaction
 *   - @/lib/log/types      untuk type-only imports
 */

import "server-only";
import { db } from "@/lib/db/client";
import { appLogs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { sanitizeContext } from "./sanitize";
import type {
  LogContext,
  LogLevel,
  LogType,
  EventName,
} from "./types";

export type { LogContext, LogLevel, LogType, EventName } from "./types";

type WriteInput = {
  type: LogType;
  level: LogLevel | null;
  name: string;
  context?: LogContext;
  route?: string | null;
  userAgent?: string | null;
};

async function resolveUserId(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.userId ?? null;
  } catch {
    return null;
  }
}

async function writeLog(input: WriteInput): Promise<void> {
  try {
    const userId = await resolveUserId();
    const sanitized = sanitizeContext(input.context ?? {});
    await db.insert(appLogs).values({
      type: input.type,
      level: input.level,
      name: input.name,
      context: sanitized,
      userId,
      route: input.route ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (err) {
    // Fallback ke console — jangan throw, jangan crash caller.
    console.error("[log] failed to persist:", err, {
      type: input.type,
      level: input.level,
      name: input.name,
    });
  }
}

/**
 * Fire-and-forget log dispatcher. Internal use — pakai info/warn/error/fatal/event.
 */
function dispatch(input: WriteInput): void {
  void writeLog(input);
}

// ============================================================
// Public API — semua fire-and-forget (return void, NOT Promise)
// ============================================================

export function info(message: string, context?: LogContext): void {
  dispatch({ type: "log", level: "info", name: message, context });
}

export function warn(message: string, context?: LogContext): void {
  dispatch({ type: "log", level: "warn", name: message, context });
}

export function error(message: string, context?: LogContext): void {
  dispatch({ type: "log", level: "error", name: message, context });
}

export function fatal(message: string, context?: LogContext): void {
  dispatch({ type: "log", level: "fatal", name: message, context });
}

export function event(name: EventName, context?: LogContext): void {
  dispatch({ type: "event", level: null, name, context });
}

/**
 * Convenience: log thrown Error dengan stack trace + extra context.
 */
export function logException(
  err: unknown,
  message: string,
  context?: LogContext
): void {
  const errCtx =
    err instanceof Error
      ? { error: err }
      : { error: { message: String(err) } };
  error(message, { ...errCtx, ...context });
}
