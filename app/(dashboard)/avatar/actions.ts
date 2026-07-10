"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { avatarConfigSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export async function saveAvatarConfigAction(config: unknown) {
  const parsed = avatarConfigSchema.safeParse(config);
  if (!parsed.success) return { success: false, message: "Invalid avatar configuration." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // Saving a built avatar clears any uploaded photo URL so the map and
  // people list consistently show one or the other, never a stale mix.
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_config: parsed.data, avatar_url: null })
    .eq("id", user.id);

  if (error) {
    logger.error("avatar_save_failed", { message: error.message });
    return { success: false, message: "Couldn't save your avatar." };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Avatar saved." };
}
