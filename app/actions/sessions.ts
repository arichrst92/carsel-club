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
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(60, "Maksimal 60 karakter"),
  venueName: z.string().trim().max(80).optional().or(z.literal("")),
  scheduledAt: z
    .string()
    .min(1, "Tanggal & waktu wajib diisi")
    .refine((s) => !isNaN(new Date(s).getTime()), "Format tanggal tidak valid"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(30, "Durasi minimum 30 menit")
    .max(720, "Durasi maksimum 12 jam"),
  numCourts: z.coerce.number().int().min(1, "Minimum 1 court").max(20, "Maksimum 20 court"),
  fixPartners: z.coerce.boolean().default(false),
  description: z.string().trim().max(500).optional().or(z.literal("")),
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

  const raw = {
    title: formData.get("title"),
    venueName: formData.get("venue_name"),
    scheduledAt: formData.get("scheduled_at"),
    durationMinutes: formData.get("duration_minutes"),
    numCourts: formData.get("num_courts"),
    fixPartners: formData.get("fix_partners") === "on",
    description: formData.get("description"),
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
  const scheduledEndDate = new Date(
    scheduledDate.getTime() + input.durationMinutes * 60 * 1000
  );

  let newSessionId: string;
  try {
    newSessionId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(sessions)
        .values({
          title: input.title,
          hostId: user!.id,
          venueName: input.venueName || null,
          scheduledAt: scheduledDate,
          scheduledEndAt: scheduledEndDate,
          numCourts: input.numCourts,
          fixPartners: input.fixPartners,
          description: input.description || null,
          // v1 defaults (per concept)
          format: "americano",
          playType: "freeplay",
          visibility: "private",
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
