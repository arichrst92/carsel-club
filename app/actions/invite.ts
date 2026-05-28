"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { setReferrerCookie } from "@/lib/auth/referral";
import { getSession } from "@/lib/auth/session";

/**
 * Accept invite — set referrer cookie & redirect.
 * Called from /invite/[code]/page.tsx button.
 */
export async function acceptInviteAction(referrerCode: string): Promise<void> {
  // If already logged in, just go home
  const session = await getSession();
  if (session) redirect("/home");

  // Validate referrer exists
  const [referrer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, referrerCode))
    .limit(1);

  if (!referrer) {
    redirect("/login?error=invalid_invite");
  }

  // Set cookie & redirect to login
  await setReferrerCookie(referrer!.id);
  redirect("/login");
}
