"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviteSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export async function createInviteAction(formData: FormData) {
  const parsed = inviteSchema.safeParse({
    label: formData.get("label"),
    relationship: formData.get("relationship"),
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data: inserted, error } = await supabase
    .from("connections")
    .insert({
      owner_id: user.id,
      label: parsed.data.label,
      relationship: parsed.data.relationship,
    })
    .select("invite_token")
    .single();

  if (error || !inserted) {
    logger.error("invite_create_failed", { message: error?.message });
    return { success: false, message: "Couldn't create the invite. Try again." };
  }

  revalidatePath("/people");
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inserted.invite_token}`;
  return { success: true, message: `Link ready — copy and send it to ${parsed.data.label} however you like.`, link };
}

export async function respondToInviteByTokenAction(token: string, action: "accept" | "decline") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in first." };

  const { data, error } = await supabase.rpc("accept_invite_by_token", {
    p_token: token,
    p_accept: action === "accept",
  });

  const result = data?.[0];
  if (error || !result?.success) {
    logger.warn("invite_token_respond_failed", { message: error?.message ?? result?.message });
    return { success: false, message: result?.message ?? "Couldn't process this invite. Try again." };
  }

  revalidatePath("/people");
  return { success: true };
}

export async function revokeConnectionAction(connectionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("connections").update({ status: "revoked" }).eq("id", connectionId);
  revalidatePath("/people");
  return { success: !error };
}
