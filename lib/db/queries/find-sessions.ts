/**
 * Public session discovery queries.
 */

import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessionParticipants,
  sessions,
  users,
} from "@/lib/db/schema";

export async function listPublicSessions(filter?: {
  city?: string | null;
  excludeUserId?: string;
}) {
  // Fetch public sessions that are upcoming or live
  const allPublic = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      hostId: sessions.hostId,
      venueName: sessions.venueName,
      mapsUrl: sessions.mapsUrl,
      coverPhotoUrl: sessions.coverPhotoUrl,
      scheduledAt: sessions.scheduledAt,
      scheduledEndAt: sessions.scheduledEndAt,
      format: sessions.format,
      numCourts: sessions.numCourts,
      status: sessions.status,
      visibility: sessions.visibility,
      description: sessions.description,
      hostName: users.displayName,
      hostCity: users.city,
    })
    .from(sessions)
    .leftJoin(users, eq(users.id, sessions.hostId))
    .where(
      and(
        eq(sessions.visibility, "public"),
        or(eq(sessions.status, "upcoming"), eq(sessions.status, "live"))
      )
    )
    .orderBy(asc(sessions.scheduledAt));

  // Get participant counts
  if (allPublic.length === 0) return [];

  const sessionIds = allPublic.map((s) => s.id);
  const allParticipants = await db
    .select({
      sessionId: sessionParticipants.sessionId,
      userId: sessionParticipants.userId,
    })
    .from(sessionParticipants)
    .where(inArray(sessionParticipants.sessionId, sessionIds));

  const countBySession: Record<string, number> = {};
  const usersBySession: Record<string, Set<string>> = {};
  for (const p of allParticipants) {
    countBySession[p.sessionId] = (countBySession[p.sessionId] ?? 0) + 1;
    if (p.userId) {
      if (!usersBySession[p.sessionId]) usersBySession[p.sessionId] = new Set();
      usersBySession[p.sessionId].add(p.userId);
    }
  }

  let result = allPublic.map((s) => ({
    ...s,
    participantCount: countBySession[s.id] ?? 0,
    isAlreadyMember: filter?.excludeUserId
      ? usersBySession[s.id]?.has(filter.excludeUserId) ?? false
      : false,
  }));

  // Optional city filter (case-insensitive partial)
  if (filter?.city) {
    const q = filter.city.toLowerCase();
    result = result.filter((s) => s.hostCity?.toLowerCase().includes(q));
  }

  return result;
}
