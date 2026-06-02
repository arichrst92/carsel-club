/**
 * Admin auth helpers.
 *
 * Sprint 2: minimal — check users.isAdmin boolean.
 * Sprint 35 expand: super-admin tools (user search, manual override, dll).
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-current-user";
import type { User } from "@/lib/db/types";

/**
 * Returns admin user atau null. Tidak redirect — caller decide.
 */
export async function getAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

/**
 * Like requireUser tapi additionally enforce isAdmin=true.
 * Non-admin di-redirect ke /home (tidak expose admin route existence).
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/home");
  return user;
}

/**
 * Pure check — useful di Server Action atau API route.
 */
export function isAdminUser(user: { isAdmin: boolean } | null): boolean {
  return !!user?.isAdmin;
}
