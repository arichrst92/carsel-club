"use server";

/**
 * Session-related Server Actions.
 * - createSessionAction: create + auto-add host as participant
 * - cancelSessionAction: freeze session (status='cancelled')
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sessions, sessionParticipants } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";

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
  playType: z.enum(["freeplay", "tournament"]).default("freeplay"),
  visibility: z.enum(["private", "public"]).default("private"),
  venueName: z.string().trim().min(1, "Venue wajib diisi").max(80),
  mapsUrl: z.string().trim().max(500).optional(),
  scheduledAt: z
    .string()
    .min(1, "Tanggal & waktu wajib diisi")
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
    playType: s("play_type") ?? "freeplay",
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
          scheduledAt: scheduledDate,
          scheduledEndAt: scheduledEndDate,
          numCourts: input.numCourts,
          maxRounds: input.maxRounds ?? null,
          fixPartners: input.fixPartners,
          description: input.description || null,
          format: input.format,
          playType: input.playType,
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

  revalidatePath("/sessions");
  redirect(`/sessions/${newSessionId}`);
}

// ============================================================
// Cancel Session
// ============================================================

export async function cancelSessionAction(
  sessionId: string
): Promise<SessionActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isStaff = await isSessionStaff(sessionId, user.id);
  if (!isStaff) {
    return { error: "Hanya host/co-host yang bisa cancel" };
  }

  try {
    await db
      .update(sessions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    console.error("[cancelSessionAction] error:", e);
    return { error: "Gagal cancel. Coba lagi." };
  }

  revalidatePath("/sessions");
  revalidatePath(`/sessions/${sessionId}`);
  return null;
}
