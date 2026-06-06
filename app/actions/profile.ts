"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { event } from "@/lib/log";

export type ProfileActionState = { error?: string } | null;

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const cityRaw = String(formData.get("city") ?? "").trim();
  const city = cityRaw.length > 0 ? cityRaw : null;
  const visibilityRaw = String(formData.get("profile_visibility") ?? "").trim();

  if (displayName.length < 2 || displayName.length > 30) {
    return { error: "Nama harus 2-30 karakter" };
  }
  if (city && city.length > 50) {
    return { error: "Nama kota maksimal 50 karakter" };
  }

  const validVisibility = ["public", "friends", "private"].includes(
    visibilityRaw
  );
  const updates: {
    displayName: string;
    city: string | null;
    profileVisibility?: "public" | "friends" | "private";
    updatedAt: Date;
  } = { displayName, city, updatedAt: new Date() };
  if (validVisibility) {
    updates.profileVisibility = visibilityRaw as
      | "public"
      | "friends"
      | "private";
  }

  try {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, session!.userId));
  } catch (e) {
    console.error("[updateProfileAction] error:", e);
    return { error: "Gagal update profil. Coba lagi." };
  }

  if (validVisibility) {
    event("profile_visibility_changed", {
      userId: session!.userId,
      visibility: updates.profileVisibility,
    });
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath(`/u/${session!.userId}`);
  return null;
}
