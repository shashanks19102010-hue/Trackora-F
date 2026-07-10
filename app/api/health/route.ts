import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Lightweight health check for uptime monitors / Vercel — verifies the
// process is up and that the database connection is reachable.
export async function GET() {
  const checks: Record<string, "ok" | "error"> = { server: "ok", database: "ok" };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) checks.database = "error";
  } catch {
    checks.database = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ status: healthy ? "healthy" : "degraded", checks, time: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
