import { z } from "zod";

/**
 * Centralized input validation. Every form and API route should validate
 * against one of these schemas before touching the database — never trust
 * client input, even from our own UI.
 */

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email").max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// E.164 phone format, e.g. +14155552671 — this is an identifier for sending
// an invite, never a lookup key for locating someone without their consent.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155551234");

export const inviteSchema = z.object({
  label: z.string().trim().min(1, "Give this person a name").max(60),
  relationship: z.enum(["family", "friend", "colleague", "other"]),
});

export const inviteAcceptSchema = z.object({
  token: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const privacySettingsSchema = z.object({
  shareLocationWith: z.array(z.string().uuid()),
  precision: z.enum(["exact", "approximate", "city-only"]),
  shareWhenActive: z.boolean(),
  historyRetentionDays: z.number().int().min(1).max(365),
  ghostMode: z.boolean(),
});

export const locationPingSchema = z.object({
  deviceId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(100000),
  capturedAt: z.string().datetime(),
  batteryPct: z.number().min(0).max(100).optional(),
});

export const avatarConfigSchema = z.object({
  skinTone: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hairStyle: z.enum(["bald", "short", "curly", "long", "buzz", "mohawk"]),
  hairColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  eyes: z.enum(["round", "sleepy", "sharp", "wink"]),
  mouth: z.enum(["smile", "neutral", "grin", "surprised"]),
  accessory: z.enum(["none", "glasses", "sunglasses", "cap"]),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type LocationPingInput = z.infer<typeof locationPingSchema>;
