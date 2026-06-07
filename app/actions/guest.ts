"use server";

/**
 * Guest join action (Sprint 19).
 *
 * Anonymous user join session sebagai guest (no signup).
 * Validates: session ada + non-terminal + name 1-30 char.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/guest-join.html
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 19
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sessions, sessionParticipants } from "@/lib/db/schema";
import { addGuestSession } from "@/lib/auth/guest-session";
import { event } from "@/lib/log";

export type GuestJoinState = {
  error?: string;
  success?: string;
} | null;

const Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama required")
    .max(30, "Nama maksimal 30 karakter"),
});

export async function joinAsGuestAction(
  sessionId: string,
  _prev: GuestJoinState,
  formData: FormData
): Promise<GuestJoinState> {
  const parsed = Schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalid" };
  }
  const { name } = parsed.data;

  // Validate session
  const [session] = await db
    .select({
      id: sessions.id,
      status: sessions.status,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) return { error: "Session tidak ditemukan" };
  if (session.status === "cancelled" || session.status === "completed") {
    return { error: "Session sudah selesai/dibatalkan" };
  }

  // Insert participant
  let participantId: string;
  try {
    const [inserted] = await db
      .insert(sessionParticipants)
      .values({
        sessionId,
        role: "guest",
        guestName: name,
        isPlaying: true,
      })
      .returning({ id: sessionParticipants.id });
    participantId = inserted.id;
  } catch (e) {
    console.error("[joinAsGuestAction]", e);
    return { error: "Gagal join sebagai guest. Coba lagi." };
  }

  await addGuestSession({ sessionId, participantId, name });

  event("guest_joined", { sessionId, participantId, name });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/s/${sessionId}`);
  redirect(`/s/${sessionId}?joined=1`);
}
