"use server";

/**
 * Session-related Server Actions.
 * - createSessionAction: create + auto-add host as participant
 * - cancelSessionAction: freeze session (status='cancelled')
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { syncHostAchievements } from "@/lib/match/achievement-sync";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sessions, sessionParticipants } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { event } from "@/lib/log";
import {
  transitionForEnd,
  transitionForStart,
  transitionForCancel,
  transitionForReopen,
  type SessionStatus,
} from "@/lib/sessions/lifecycle";
import { matchRoundSets } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export type SessionActionState = { error?: string } | null;

// ============================================================
// Validation
// ============================================================

const CreateSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Nama session minimal 2 karakter")
    .max(60, "Maksimal 60 karakter"),
  format: z.enum(["americano", "mexicano", "tournament"]).default("americano"),
  visibility: z.enum(["private", "public"]).default("private"),
  venueName: z.string().trim().min(1, "Venue required").max(80),
  mapsUrl: z.string().trim().max(500).optional(),
  scheduledAt: z
    .string()
    .min(1, "Tanggal & waktu required")
    .refine((s) => !isNaN(new Date(s).getTime()), "Format tanggal tidak valid"),
  scheduledEndAt: z
    .string()
    .optional()
    .refine(
      (s) => !s || !isNaN(new Date(s).getTime()),
      "Format jam berakhir tidak valid"
    ),
  numCourts: z.coerce
    .number()
    .int()
    .min(1, "Minimum 1 court")
    .max(20, "Maksimum 20 court"),
  maxRounds: z.coerce.number().int().min(1).max(50).optional(),
  fixPartners: z.coerce.boolean().default(false),
  description: z.string().trim().max(500).optional(),
  hostIsPlaying: z.coerce.boolean().default(true),
});

// ============================================================
// Create Session
// ============================================================

export async function createSessionAction(
  formData: FormData
): Promise<SessionActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Helper: formData.get returns string | File | null; coerce to string|undefined for Zod
  const s = (k: string): string | undefined => {
    const v = formData.get(k);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const raw = {
    title: s("title"),
    format: s("format") ?? "americano",
    visibility: s("visibility") ?? "private",
    venueName: s("venue_name"),
    mapsUrl: s("maps_url"),
    scheduledAt: s("scheduled_at"),
    scheduledEndAt: s("scheduled_end_at"),
    numCourts: s("num_courts"),
    maxRounds: s("max_rounds"),
    fixPartners: formData.get("fix_partners") === "on",
    description: s("description"),
    hostIsPlaying: formData.get("host_is_playing") !== "off",
  };

  const parsed = CreateSessionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Input tidak valid" };
  }
  const input = parsed.data;

  const scheduledDate = new Date(input.scheduledAt);
  if (scheduledDate.getTime() < Date.now() - 60_000) {
    return { error: "Tanggal & waktu harus di masa depan" };
  }
  const scheduledEndDate = input.scheduledEndAt
    ? new Date(input.scheduledEndAt)
    : null;
  if (scheduledEndDate && scheduledEndDate.getTime() <= scheduledDate.getTime()) {
    return { error: "Jam berakhir harus setelah jam mulai" };
  }

  let newSessionId: string;
  try {
    newSessionId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(sessions)
        .values({
          title: input.title,
          hostId: user!.id,
          venueName: input.venueName,
          mapsUrl: input.mapsUrl || null,
          coverPhotoUrl: null,
          scheduledAt: scheduledDate,
          scheduledEndAt: scheduledEndDate,
          numCourts: input.numCourts,
          maxRounds: input.maxRounds ?? null,
          fixPartners: input.fixPartners,
          description: input.description || null,
          format: input.format,
          // Sprint 44: playType section removed dari create form.
          // Hardcoded 'freeplay' — concept deprecated, tournament jadi
          // format pilihan (bracket) bukan separate play type.
          playType: "freeplay",
          visibility: input.visibility,
          status: "upcoming",
        })
        .returning({ id: sessions.id });

      // Add host as session participant
      await tx.insert(sessionParticipants).values({
        sessionId: created.id,
        userId: user!.id,
        role: "host",
        isPlaying: input.hostIsPlaying,
      });

      return created.id;
    });
  } catch (e) {
    console.error("[createSessionAction] error:", e);
    return { error: "Gagal create session. Coba lagi." };
  }

  event("session_created", {
    sessionId: newSessionId,
    format: input.format,
    numCourts: input.numCourts,
    visibility: input.visibility,
    fixPartners: input.fixPartners,
  });

  // Sprint 29: host achievements check (after session created)
  try {
    const hostedRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(eq(sessions.hostId, user!.id));
    const hostedCount = Number(hostedRows[0]?.count ?? 0);
    await syncHostAchievements(user!.id, hostedCount);
  } catch (e) {
    console.error("[createSessionAction] host achievement sync failed:", e);
  }

  revalidatePath("/sessions");
  redirect(`/sessions/${newSessionId}`);
}

// ============================================================
// Edit Session (Sprint 18)
// ============================================================

const EditSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Nama session minimal 2 karakter")
    .max(60, "Maksimal 60 karakter"),
  venueName: z.string().trim().min(1, "Venue required").max(80),
  mapsUrl: z.string().trim().max(500).optional(),
  scheduledAt: z
    .string()
    .min(1, "Tanggal & waktu required")
    .refine((s) => !isNaN(new Date(s).getTime()), "Format tanggal tidak valid"),
  scheduledEndAt: z
    .string()
    .optional()
    .refine(
      (s) => !s || !isNaN(new Date(s).getTime()),
      "Format jam berakhir tidak valid"
    ),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["private", "public"]),
  joinPolicy: z.enum(["auto_join", "need_approval"]).optional(),
  maxRounds: z.coerce.number().int().min(1).max(50).optional(),
  // Locked-after-round1 fields (server-validate kalau dikirim)
  format: z.enum(["americano", "mexicano", "tournament"]).optional(),
  numCourts: z.coerce.number().int().min(1).max(20).optional(),
  fixPartners: z.coerce.boolean().optional(),
});

export async function editSessionAction(
  sessionId: string,
  _prev: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!(await isSessionStaff(sessionId, user!.id))) {
    return { error: "Hanya host/co-host yang bisa edit session" };
  }

  // Load current state
  const [current] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!current) return { error: "Session tidak ditemukan" };

  // Cek hasRounds untuk lock rules
  const [{ value: roundCount }] = await db
    .select({ value: count() })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId));
  const hasRounds = roundCount > 0;

  const s = (k: string): string | undefined => {
    const v = formData.get(k);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const raw = {
    title: s("title"),
    venueName: s("venue_name"),
    mapsUrl: s("maps_url"),
    scheduledAt: s("scheduled_at"),
    scheduledEndAt: s("scheduled_end_at"),
    description: s("description"),
    visibility: s("visibility") ?? "private",
    joinPolicy: s("join_policy"),
    maxRounds: s("max_rounds"),
    format: s("format"),
    numCourts: s("num_courts"),
    fixPartners:
      formData.get("fix_partners") === "on"
        ? true
        : formData.get("fix_partners") === "off"
          ? false
          : undefined,
  };

  const parsed = EditSessionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Input tidak valid" };
  }
  const input = parsed.data;

  const scheduledDate = new Date(input.scheduledAt);
  const scheduledEndDate = input.scheduledEndAt
    ? new Date(input.scheduledEndAt)
    : null;
  if (scheduledEndDate && scheduledEndDate.getTime() <= scheduledDate.getTime()) {
    return { error: "Jam berakhir harus setelah jam mulai" };
  }

  // Lock rules: kalau hasRounds, tolak perubahan match config
  const lockedChanges: string[] = [];
  if (hasRounds) {
    if (input.format !== undefined && input.format !== current.format) {
      lockedChanges.push("format");
    }
    if (
      input.numCourts !== undefined &&
      input.numCourts !== current.numCourts
    ) {
      lockedChanges.push("jumlah court");
    }
    if (
      input.fixPartners !== undefined &&
      input.fixPartners !== current.fixPartners
    ) {
      lockedChanges.push("Fix Partners");
    }
  }
  if (lockedChanges.length > 0) {
    return {
      error: `Tidak bisa ubah ${lockedChanges.join(", ")} karena sudah ada round yang ter-generate.`,
    };
  }

  const updates: Partial<typeof sessions.$inferInsert> = {
    title: input.title,
    venueName: input.venueName,
    mapsUrl: input.mapsUrl ?? null,
    scheduledAt: scheduledDate,
    scheduledEndAt: scheduledEndDate,
    description: input.description ?? null,
    visibility: input.visibility,
    maxRounds: input.maxRounds ?? null,
    updatedAt: new Date(),
  };
  if (input.joinPolicy !== undefined) {
    updates.joinPolicy = input.joinPolicy;
  }

  // Match config bisa di-update kalau belum ada round
  if (!hasRounds) {
    if (input.format !== undefined) updates.format = input.format;
    if (input.numCourts !== undefined) updates.numCourts = input.numCourts;
    if (input.fixPartners !== undefined)
      updates.fixPartners = input.fixPartners;
  }

  try {
    await db.update(sessions).set(updates).where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[editSessionAction] error:", e);
    return { error: "Failed to save. Try again." };
  }

  event("session_edited", {
    sessionId,
    hasRounds,
    changedFields: Object.keys(updates).filter((k) => k !== "updatedAt"),
  });

  revalidatePath("/sessions");
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/s/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

// ============================================================
// Lifecycle helpers — load session + staff check
// ============================================================

async function loadSessionForLifecycle(
  sessionId: string
): Promise<
  | { ok: true; current: SessionStatus }
  | { ok: false; error: string }
> {
  const [row] = await db
    .select({ status: sessions.status })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!row) return { ok: false, error: "Session tidak ditemukan" };
  return { ok: true, current: row.status as SessionStatus };
}

async function requireStaff(
  sessionId: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const isStaff = await isSessionStaff(sessionId, user!.id);
  if (!isStaff) {
    return { ok: false, error: "Hanya host/co-host yang bisa aksi ini" };
  }
  return { ok: true, userId: user!.id };
}

function revalidateSessionPaths(sessionId: string) {
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/matches`);
  revalidatePath(`/sessions/${sessionId}/participants`);
}

// ============================================================
// Cancel Session — upcoming/live → cancelled
// ============================================================

export async function cancelSessionAction(
  sessionId: string
): Promise<SessionActionState> {
  const auth = await requireStaff(sessionId);
  if (!auth.ok) return { error: auth.error };
  const loaded = await loadSessionForLifecycle(sessionId);
  if (!loaded.ok) return { error: loaded.error };

  let target: SessionStatus;
  try {
    target = transitionForCancel(loaded.current);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Cancel tidak diperbolehkan" };
  }

  try {
    await db
      .update(sessions)
      .set({ status: target, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[cancelSessionAction] error:", e);
    return { error: "Gagal cancel. Coba lagi." };
  }

  event("session_cancelled", {
    sessionId,
    wasLive: loaded.current === "live",
    priorStatus: loaded.current,
  });

  revalidateSessionPaths(sessionId);
  return null;
}

// ============================================================
// Start Session — upcoming → live (explicit)
// ============================================================

export async function startSessionAction(
  sessionId: string
): Promise<SessionActionState> {
  const auth = await requireStaff(sessionId);
  if (!auth.ok) return { error: auth.error };
  const loaded = await loadSessionForLifecycle(sessionId);
  if (!loaded.ok) return { error: loaded.error };

  let target: SessionStatus;
  try {
    target = transitionForStart(loaded.current);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tidak bisa start" };
  }

  try {
    await db
      .update(sessions)
      .set({ status: target, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[startSessionAction] error:", e);
    return { error: "Gagal start. Coba lagi." };
  }

  event("session_started", { sessionId, priorStatus: loaded.current });
  revalidateSessionPaths(sessionId);
  return null;
}

// ============================================================
// End Session — upcoming/live → completed
// ============================================================

export async function endSessionAction(
  sessionId: string
): Promise<SessionActionState> {
  const auth = await requireStaff(sessionId);
  if (!auth.ok) return { error: auth.error };
  const loaded = await loadSessionForLifecycle(sessionId);
  if (!loaded.ok) return { error: loaded.error };

  let target: SessionStatus;
  try {
    target = transitionForEnd(loaded.current);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tidak bisa end" };
  }

  try {
    await db
      .update(sessions)
      .set({
        status: target,
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[endSessionAction] error:", e);
    return { error: "Gagal end. Coba lagi." };
  }

  event("session_ended", { sessionId, priorStatus: loaded.current });
  revalidateSessionPaths(sessionId);
  return null;
}

// ============================================================
// Reopen Session — completed/cancelled → live (kalau ada rounds) atau upcoming
// ============================================================

export async function reopenSessionAction(
  sessionId: string
): Promise<SessionActionState> {
  const auth = await requireStaff(sessionId);
  if (!auth.ok) return { error: auth.error };
  const loaded = await loadSessionForLifecycle(sessionId);
  if (!loaded.ok) return { error: loaded.error };

  // Cek apakah ada rounds
  const [roundRow] = await db
    .select({ id: matchRoundSets.id })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId))
    .limit(1);
  const hasRounds = !!roundRow;

  let target: SessionStatus;
  try {
    target = transitionForReopen(loaded.current, hasRounds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tidak bisa reopen" };
  }

  try {
    await db
      .update(sessions)
      .set({
        status: target,
        endedAt: null, // bersihkan ended_at saat reopen
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[reopenSessionAction] error:", e);
    return { error: "Gagal reopen. Coba lagi." };
  }

  event("session_reopened", {
    sessionId,
    priorStatus: loaded.current,
    targetStatus: target,
    hasRounds,
  });
  revalidateSessionPaths(sessionId);
  return null;
}
