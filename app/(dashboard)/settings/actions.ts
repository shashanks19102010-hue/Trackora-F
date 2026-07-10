"use server";

import { revalidatePath } from "next/cache";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema, privacySettingsSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export async function updateProfileAction(formData: FormData) {
  const parsed = profileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl") || "",
  });
  if (!parsed.success) return { success: false, message: "Check the highlighted fields." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl || null,
      avatar_config: parsed.data.avatarUrl ? null : undefined,
    })
    .eq("id", user.id);

  if (error) {
    logger.error("profile_update_failed", { message: error.message });
    return { success: false, message: "Couldn't update your profile." };
  }

  revalidatePath("/settings");
  return { success: true, message: "Profile updated." };
}

export async function toggleGhostModeAction(enabled: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("privacy_settings")
    .upsert({ user_id: user.id, ghost_mode: enabled, updated_at: new Date().toISOString() });

  revalidatePath("/", "layout");
  return { success: !error };
}

export async function updatePrivacyAction(input: {
  shareLocationWith: string[];
  precision: "exact" | "approximate" | "city-only";
  shareWhenActive: boolean;
  historyRetentionDays: number;
  ghostMode: boolean;
}) {
  const parsed = privacySettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from("privacy_settings").upsert({
    user_id: user.id,
    share_location_with: parsed.data.shareLocationWith,
    precision: parsed.data.precision,
    share_when_active: parsed.data.shareWhenActive,
    history_retention_days: parsed.data.historyRetentionDays,
    ghost_mode: parsed.data.ghostMode,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/settings");
  return { success: !error };
}

export async function generateTwoFactorSecretAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const };

  const secret = authenticator.generateSecret();
  const issuer = process.env.NEXT_PUBLIC_2FA_ISSUER ?? "TRACKORA";
  const otpauth = authenticator.keyuri(user.email ?? user.id, issuer, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Stored under RLS as the user's own row — no admin client needed.
  await supabase.from("profiles").update({ two_factor_pending_secret: secret }).eq("id", user.id);

  return { success: true as const, qrDataUrl, secret };
}

export async function verifyTwoFactorAction(code: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("two_factor_pending_secret")
    .eq("id", user.id)
    .single();

  const secret = profile?.two_factor_pending_secret;
  if (!secret) return { success: false, message: "Start setup again." };

  const isValid = authenticator.verify({ token: code, secret });
  if (!isValid) return { success: false, message: "That code didn't match. Try again." };

  await supabase
    .from("profiles")
    .update({ two_factor_enabled: true, two_factor_secret: secret, two_factor_pending_secret: null })
    .eq("id", user.id);

  revalidatePath("/settings");
  return { success: true, message: "Two-factor authentication enabled." };
}

export async function disableTwoFactorAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from("profiles")
    .update({ two_factor_enabled: false, two_factor_secret: null })
    .eq("id", user.id);

  revalidatePath("/settings");
  return { success: true };
}
