/**
 * Root route — redirect to /home (authed) or /login (unauthed).
 * Middleware handles the redirect; this just renders briefly.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/home" : "/login");
}
