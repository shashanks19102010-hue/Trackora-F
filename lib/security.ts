/**
 * Security Utilities
 * Centralized security functions: sanitization, validation, encryption
 */

import { z } from "zod";

/**
 * Server-only environment variables
 * Never reference these from Client Components
 */
export const getSecureEnv = () => {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSecureEnv() called on client. Use NEXT_PUBLIC_* for public vars."
    );
  }

  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };
};

/**
 * Input validation schemas
 */
export const schemas = {
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be 8+ characters"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .optional(),
  url: z.string().url("Invalid URL"),
  uuid: z.string().uuid("Invalid UUID"),
};

/**
 * Sanitize user input
 */
export const sanitize = {
  text: (input: string): string => {
    return input
      .trim()
      .replace(/[<>"']/g, "") // Remove potential XSS vectors
      .slice(0, 1000); // Cap length
  },

  email: (input: string): string => {
    return input.toLowerCase().trim().slice(0, 254);
  },

  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return "";
    }
  },
};

/**
 * Validate and sanitize object
 */
export const validateAndSanitize = async <T>(
  data: unknown,
  schema: z.ZodSchema
): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors[0].message}`);
    }
    throw error;
  }
};

/**
 * Rate limiting (in-memory for single-server deployments)
 * For production, use Redis
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = {
  check: (key: string, maxAttempts: number = 5, windowMs: number = 60000) => {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: maxAttempts - record.count };
  },

  reset: (key: string) => {
    rateLimitMap.delete(key);
  },
};

/**
 * CORS & Security Headers
 */
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "no-referrer",
};
