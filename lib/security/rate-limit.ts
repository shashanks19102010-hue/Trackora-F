import { createAdminClient } from "@/lib/supabase/server";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8;

/**
 * Brute-force protection for login. Checks the last 15 minutes of attempts
 * for this identifier (email, lowercased) using the service-role client —
 * this table has no RLS policies at all, so it's unreachable from the browser.
 */
export async function isRateLimited(identifier: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count } = await admin
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier.toLowerCase())
    .eq("succeeded", false)
    .gte("created_at", since);

  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(identifier: string, succeeded: boolean): Promise<void> {
  const admin = createAdminClient();
  await admin.from("login_attempts").insert({ identifier: identifier.toLowerCase(), succeeded });
}
