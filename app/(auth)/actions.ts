"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import { isRateLimited, recordLoginAttempt } from "@/lib/security/rate-limit";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: flattenErrors(parsed.error) };
  }

  const supabase = createClient();
  const redirectedFrom = formData.get("redirectedFrom");
  const safeRedirect = typeof redirectedFrom === "string" && redirectedFrom.startsWith("/") ? redirectedFrom : "";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify${safeRedirect ? `?redirectedFrom=${encodeURIComponent(safeRedirect)}` : ""}`,
    },
  });

  if (error) {
    logger.warn("signup_failed", { message: error.message });
    // Generic message — never reveal whether an email is already registered.
    return { success: false, message: "Couldn't create your account. Please try again." };
  }

  return { success: true, message: "Check your email to verify your account." };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totpCode: formData.get("totpCode") || undefined,
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: flattenErrors(parsed.error) };
  }

  // Brute-force protection: block after too many failed attempts for this
  // email within a rolling 15-minute window, regardless of correct password.
  if (await isRateLimited(parsed.data.email)) {
    logger.warn("login_rate_limited", { email: parsed.data.email });
    return { success: false, message: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await recordLoginAttempt(parsed.data.email, false);
    logger.warn("login_failed", { message: error.message });
    return { success: false, message: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("two_factor_enabled, two_factor_secret")
    .eq("id", data.user.id)
    .single();

  if (profile?.two_factor_enabled) {
    if (!parsed.data.totpCode) {
      return { success: false, message: "TWO_FACTOR_REQUIRED" };
    }
    const { authenticator } = await import("otplib");
    const isValid = profile.two_factor_secret
      ? authenticator.verify({ token: parsed.data.totpCode, secret: profile.two_factor_secret })
      : false;
    if (!isValid) {
      await recordLoginAttempt(parsed.data.email, false);
      return { success: false, message: "TWO_FACTOR_REQUIRED" };
    }
  }

  await recordLoginAttempt(parsed.data.email, true);
  const redirectedFrom = formData.get("redirectedFrom");
  redirect(typeof redirectedFrom === "string" && redirectedFrom.startsWith("/") ? redirectedFrom : "/map");
}

export async function signInWithGoogleAction(formData: FormData) {
  const supabase = createClient();
  const redirectedFrom = formData.get("redirectedFrom");
  const safeRedirect = typeof redirectedFrom === "string" && redirectedFrom.startsWith("/") ? redirectedFrom : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback${safeRedirect ? `?redirectedFrom=${encodeURIComponent(safeRedirect)}` : ""}`,
    },
  });

  if (error || !data.url) {
    logger.error("google_oauth_failed", { message: error?.message });
    return { success: false, message: "Google sign-in is unavailable right now." };
  }

  redirect(data.url);
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, fieldErrors: flattenErrors(parsed.error) };

  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  // Always return success — don't leak which emails have accounts.
  return { success: true, message: "If that email exists, a reset link is on its way." };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { success: false, fieldErrors: flattenErrors(parsed.error) };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logger.error("reset_password_failed", { message: error.message });
    return { success: false, message: "That reset link has expired. Request a new one." };
  }

  redirect("/login");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function flattenErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const key in flat) {
    const first = flat[key]?.[0];
    if (first) result[key] = first;
  }
  return result;
}
