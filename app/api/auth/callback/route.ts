import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Handles the redirect back from Supabase after OAuth (Google) or email-link
// verification, exchanging the auth code for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectedFrom") ?? "/map";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.error("oauth_exchange_failed", { message: error.message });
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
