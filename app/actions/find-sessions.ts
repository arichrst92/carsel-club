"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessionParticipants, sessions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Join a public session as player.
 * Validates: session is public, not terminal, user not already participant.
 */
export async function joinPublicSessionAction(
  sessionId: string
): Promise<{ error?: string; success?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [session] = await db
    .select({
      id: sessions.id,
      visibility: sessions.visibility,
      status: sessions.status,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return { error: "Session tidak ditemukan" };
  if (session.visibility !== "public") {
    return { error: "Session ini private, hanya bisa join via invite link" };
  }
  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "Session sudah selesai/dibatalkan" };
  }

  // Check duplicate
  const [existing] = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, me.id)
      )
    )
    .limit(1);
  if (existing) return { error: "Kamu sudah join session ini" };

  try {
    await db.insert(sessionParticipants).values({
      sessionId,
      userId: me.id,
      role: "player",
      isPlaying: true,
    });
  } catch (e) {
    console.error("[joinPublicSessionAction]", e);
    return { error: "Gagal join session." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/find");
  return { success: "Berhasil bergabung! Lihat detail sesi." };
}
