/**
 * Session group photos queries (Sprint 10).
 */

import { asc, desc, eq, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessionGroupPhotos, users } from "@/lib/db/schema";

export type GroupPhotoRow = {
  id: string;
  url: string;
  storageKey: string;
  uploadedByUserId: string | null;
  uploadedByName: string | null;
  createdAt: Date;
};

export async function listGroupPhotos(
  sessionId: string
): Promise<GroupPhotoRow[]> {
  const rows = await db
    .select({
      id: sessionGroupPhotos.id,
      url: sessionGroupPhotos.url,
      storageKey: sessionGroupPhotos.storageKey,
      uploadedByUserId: sessionGroupPhotos.uploadedByUserId,
      uploadedByName: users.displayName,
      createdAt: sessionGroupPhotos.createdAt,
    })
    .from(sessionGroupPhotos)
    .leftJoin(users, eq(users.id, sessionGroupPhotos.uploadedByUserId))
    .where(eq(sessionGroupPhotos.sessionId, sessionId))
    .orderBy(asc(sessionGroupPhotos.createdAt));

  return rows;
}

export async function countGroupPhotos(sessionId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(sessionGroupPhotos)
    .where(eq(sessionGroupPhotos.sessionId, sessionId));
  return row?.value ?? 0;
}
