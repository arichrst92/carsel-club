"use server";

/**
 * Participant management Server Actions.
 *
 * - searchMember:    find user by WA number (no DB mutation)
 * - addMember:       add a User as participant (role='player')
 * - addGuest:        add ephemeral guest by name (no user_id)
 * - removeParticipant
 * - toggleCohost:    promote player ↔ co_host (non-guest only per G4)
 * - togglePlaying:   flip is_playing flag
 *
 * All mutations require host/co_host (isSessionStaff check).
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sessionParticipants, sessions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { normalizePhone, isValidIndonesianPhone } from "@/lib/auth/otp";
import { notifySessionInvite } from "@/lib/notifications/generate";

export type FoundUser = {
  id: string;
  displayName: string;
  whatsappNumber: string;
  avatarUrl: string | null;
  city: string | null;
};

export type ParticipantActionState =
  | {
      error?: string;
      success?: string;
      foundUser?: FoundUser;
    }
  | null;

// ============================================================
// 1. Search member by phone
// ============================================================

export async function searchMemberAction(
  _prev: ParticipantActionState,
  formData: FormData
): Promise<ParticipantActionState> {
  const rawPhone = String(formData.get("phone") ?? "").trim();
  if (!rawPhone) return { error: "Nomor WhatsApp required" };

  const phone = normalizePhone(rawPhone);
  if (!isValidIndonesianPhone(phone)) {
    return { error: "Nomor WhatsApp Indonesia tidak valid" };
  }

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      avatarUrl: users.avatarUrl,
      city: users.city,
    })
    .from(users)
    .where(eq(users.whatsappNumber, phone))
    .limit(1);

  if (!user) {
    return {
      error: `No user is registered with this number yet. Add them as a Guest using just their name.`,
    };
  }

  return { foundUser: user };
}

// ============================================================
// 2. Add member
// ============================================================

const AddMemberSchema = z.object({
  sessionId: z.string().uuid("Session ID invalid"),
  userId: z.string().uuid("User ID invalid"),
});

export async function addMemberAction(
  _prev: ParticipantActionState,
  formData: FormData
): Promise<ParticipantActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const parsed = AddMemberSchema.safeParse({
    sessionId: formData.get("session_id"),
    userId: formData.get("user_id"),
  });
  if (!parsed.success) return { error: "Input tidak valid" };

  const { sessionId, userId } = parsed.data;

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "Only host/co-host can add players" };
  }

  // Pre-check duplicate (UNIQUE constraint would catch, but UX cleaner)
  const [existing] = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    )
    .limit(1);

  if (existing) return { error: "User sudah ada di session ini" };

  try {
    await db.insert(sessionParticipants).values({
      sessionId,
      userId,
      role: "player",
      isPlaying: true,
    });
  } catch (e) {
    console.error("[addMemberAction]", e);
    return { error: "Failed to add player. Try again." };
  }

  // Sprint 25: notify invited user
  const [session] = await db
    .select({ title: sessions.title })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (session) {
    await notifySessionInvite(userId, {
      sessionId,
      sessionTitle: session.title,
      inviterName: me!.displayName,
    });
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/participants`);
  return { success: "Member added" };
}

// ============================================================
// 3. Add guest
// ============================================================

const AddGuestSchema = z.object({
  sessionId: z.string().uuid("Session ID invalid"),
  guestName: z
    .string()
    .trim()
    .min(1, "Nama guest required")
    .max(30, "Nama maksimal 30 karakter"),
});

export async function addGuestAction(
  _prev: ParticipantActionState,
  formData: FormData
): Promise<ParticipantActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const parsed = AddGuestSchema.safeParse({
    sessionId: formData.get("session_id"),
    guestName: formData.get("guest_name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalid" };
  }

  const { sessionId, guestName } = parsed.data;

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa tambah guest" };
  }

  try {
    await db.insert(sessionParticipants).values({
      sessionId,
      role: "guest",
      guestName,
      isPlaying: true,
    });
  } catch (e) {
    console.error("[addGuestAction]", e);
    return { error: "Failed to add guest." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/participants`);
  return { success: `Guest "${guestName}" ditambahkan` };
}

// ============================================================
// 4. Remove participant (with bind args, not formData)
// ============================================================

export async function removeParticipantAction(
  participantId: string,
  sessionId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "No access" };
  }

  const [p] = await db
    .select({ role: sessionParticipants.role })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.id, participantId))
    .limit(1);

  if (!p) return { error: "Participant not found" };
  if (p.role === "host") return { error: "Host tidak bisa di-remove" };

  try {
    await db
      .delete(sessionParticipants)
      .where(eq(sessionParticipants.id, participantId));
  } catch (e) {
    console.error("[removeParticipantAction]", e);
    return { error: "Failed to remove player." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}

// ============================================================
// 5. Toggle cohost (player ↔ co_host)
// ============================================================

export async function toggleCohostAction(
  participantId: string,
  sessionId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "No access" };
  }

  const [p] = await db
    .select({
      role: sessionParticipants.role,
      userId: sessionParticipants.userId,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.id, participantId))
    .limit(1);

  if (!p) return { error: "Participant not found" };
  if (p.role === "host") return { error: "Host gak perlu di-toggle" };
  if (p.role === "guest" || !p.userId) {
    return { error: "Guest tidak bisa jadi co-host" };
  }

  const newRole = p.role === "co_host" ? "player" : "co_host";

  try {
    await db
      .update(sessionParticipants)
      .set({ role: newRole })
      .where(eq(sessionParticipants.id, participantId));
  } catch (e) {
    console.error("[toggleCohostAction]", e);
    return { error: "Failed to toggle co-host." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}

// ============================================================
// 6. Toggle is_playing
// ============================================================

export async function togglePlayingAction(
  participantId: string,
  sessionId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "No access" };
  }

  const [p] = await db
    .select({ isPlaying: sessionParticipants.isPlaying })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.id, participantId))
    .limit(1);

  if (!p) return { error: "Participant not found" };

  try {
    await db
      .update(sessionParticipants)
      .set({ isPlaying: !p.isPlaying })
      .where(eq(sessionParticipants.id, participantId));
  } catch (e) {
    console.error("[togglePlayingAction]", e);
    return { error: "Failed to toggle." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}
