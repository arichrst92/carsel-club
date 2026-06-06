"use server";

/**
 * Public session join request flow (Sprint 20).
 *
 * Sessions dengan joinPolicy='need_approval' → user request, host approve/reject.
 * Sessions dengan joinPolicy='auto_join' → langsung join (existing flow).
 *
 * Refs:
 * - DB: sessions.joinPolicy + session_join_requests table
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 20
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  sessionParticipants,
  sessionJoinRequests,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { event } from "@/lib/log";
import {
  notifyJoinRequested,
  notifyJoinApproved,
  notifyJoinRejected,
} from "@/lib/notifications/generate";

export type JoinRequestState = {
  error?: string;
  success?: string;
} | null;

export async function requestJoinAction(
  sessionId: string,
  message?: string
): Promise<JoinRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [session] = await db
    .select({
      id: sessions.id,
      visibility: sessions.visibility,
      joinPolicy: sessions.joinPolicy,
      status: sessions.status,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return { error: "Session tidak ditemukan" };
  if (session.visibility !== "public") {
    return { error: "Session ini private, hanya via invite link" };
  }
  if (session.joinPolicy !== "need_approval") {
    return {
      error: "Session ini auto-join, pakai tombol Join langsung",
    };
  }
  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "Session sudah selesai/dibatalkan" };
  }

  // Already participant?
  const [existing] = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, me!.id)
      )
    )
    .limit(1);
  if (existing) return { error: "Kamu sudah join session ini" };

  // Existing request?
  const [existingReq] = await db
    .select({
      id: sessionJoinRequests.id,
      status: sessionJoinRequests.status,
    })
    .from(sessionJoinRequests)
    .where(
      and(
        eq(sessionJoinRequests.sessionId, sessionId),
        eq(sessionJoinRequests.userId, me!.id)
      )
    )
    .limit(1);
  if (existingReq) {
    if (existingReq.status === "pending") {
      return { error: "Request kamu sudah masuk, tunggu host approve" };
    }
    if (existingReq.status === "rejected") {
      return { error: "Request sebelumnya di-reject oleh host" };
    }
    // accepted but not participant? Edge case — reset to pending
    await db
      .update(sessionJoinRequests)
      .set({
        status: "pending",
        message: message?.trim() || null,
        requestedAt: new Date(),
        reviewedAt: null,
        reviewedByUserId: null,
      })
      .where(eq(sessionJoinRequests.id, existingReq.id));
  } else {
    try {
      await db.insert(sessionJoinRequests).values({
        sessionId,
        userId: me!.id,
        message: message?.trim() || null,
      });
    } catch (e) {
      console.error("[requestJoinAction]", e);
      return { error: "Gagal kirim request. Coba lagi." };
    }
  }

  event("join_requested", { sessionId, userId: me!.id });

  // Notify host
  const [sessionInfo] = await db
    .select({
      title: sessions.title,
      hostId: sessions.hostId,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (sessionInfo) {
    notifyJoinRequested(sessionInfo.hostId, {
      sessionId,
      sessionTitle: sessionInfo.title,
      requesterUserId: me!.id,
      requesterDisplayName: me!.displayName,
    });
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/find");
  return { success: "Request terkirim. Menunggu approval host." };
}

export async function approveJoinRequestAction(
  requestId: string
): Promise<JoinRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [req] = await db
    .select({
      id: sessionJoinRequests.id,
      sessionId: sessionJoinRequests.sessionId,
      userId: sessionJoinRequests.userId,
      status: sessionJoinRequests.status,
    })
    .from(sessionJoinRequests)
    .where(eq(sessionJoinRequests.id, requestId))
    .limit(1);

  if (!req) return { error: "Request tidak ditemukan" };
  if (!(await isSessionStaff(req.sessionId, me!.id))) {
    return { error: "Hanya host/co-host yang bisa approve" };
  }
  if (req.status !== "pending") {
    return { error: "Request sudah di-proses" };
  }

  try {
    await db.transaction(async (tx) => {
      // Check duplicate participant (race)
      const [existing] = await tx
        .select({ id: sessionParticipants.id })
        .from(sessionParticipants)
        .where(
          and(
            eq(sessionParticipants.sessionId, req.sessionId),
            eq(sessionParticipants.userId, req.userId)
          )
        )
        .limit(1);

      if (!existing) {
        await tx.insert(sessionParticipants).values({
          sessionId: req.sessionId,
          userId: req.userId,
          role: "player",
          isPlaying: true,
        });
      }

      await tx
        .update(sessionJoinRequests)
        .set({
          status: "accepted",
          reviewedAt: new Date(),
          reviewedByUserId: me!.id,
        })
        .where(eq(sessionJoinRequests.id, requestId));
    });
  } catch (e) {
    console.error("[approveJoinRequestAction]", e);
    return { error: "Gagal approve. Coba lagi." };
  }

  event("join_approved", { sessionId: req.sessionId, userId: req.userId });

  const [sessionInfo] = await db
    .select({ title: sessions.title })
    .from(sessions)
    .where(eq(sessions.id, req.sessionId))
    .limit(1);
  if (sessionInfo) {
    notifyJoinApproved(req.userId, {
      sessionId: req.sessionId,
      sessionTitle: sessionInfo.title,
    });
  }

  revalidatePath(`/sessions/${req.sessionId}`);
  revalidatePath(`/sessions/${req.sessionId}/participants`);
  return { success: "Request di-approve" };
}

export async function rejectJoinRequestAction(
  requestId: string
): Promise<JoinRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [req] = await db
    .select({
      id: sessionJoinRequests.id,
      sessionId: sessionJoinRequests.sessionId,
      userId: sessionJoinRequests.userId,
      status: sessionJoinRequests.status,
    })
    .from(sessionJoinRequests)
    .where(eq(sessionJoinRequests.id, requestId))
    .limit(1);

  if (!req) return { error: "Request tidak ditemukan" };
  if (!(await isSessionStaff(req.sessionId, me!.id))) {
    return { error: "Hanya host/co-host yang bisa reject" };
  }
  if (req.status !== "pending") {
    return { error: "Request sudah di-proses" };
  }

  try {
    await db
      .update(sessionJoinRequests)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedByUserId: me!.id,
      })
      .where(eq(sessionJoinRequests.id, requestId));
  } catch (e) {
    console.error("[rejectJoinRequestAction]", e);
    return { error: "Gagal reject." };
  }

  event("join_rejected", { sessionId: req.sessionId, userId: req.userId });

  const [sessionInfo] = await db
    .select({ title: sessions.title })
    .from(sessions)
    .where(eq(sessions.id, req.sessionId))
    .limit(1);
  if (sessionInfo) {
    notifyJoinRejected(req.userId, {
      sessionId: req.sessionId,
      sessionTitle: sessionInfo.title,
    });
  }

  revalidatePath(`/sessions/${req.sessionId}`);
  return { success: "Request di-reject" };
}
