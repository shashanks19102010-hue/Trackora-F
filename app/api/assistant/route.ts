import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/utils";
import { logger } from "@/lib/logger";

const SYSTEM_PROMPT = `You are ORI, the in-app assistant for TRACKORA, a consent-based location-sharing app.
Help users navigate the app (Map, Circle/invites, Devices, Notifications, Analytics, Settings) and troubleshoot
common issues: location permission problems, invites not arriving, 2FA setup, battery drain, and privacy controls.
Never claim you can locate a person who hasn't accepted an invite, and never provide guidance on tracking someone
without their consent. Keep answers short, practical, and specific to TRACKORA's features.`;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { messages } = await request.json().catch(() => ({ messages: [] }));
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { reply: "ORI isn't configured yet — add ANTHROPIC_API_KEY to your environment variables to enable live answers." },
      { status: 200 }
    );
  }

  try {
    const data = await withRetry(async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: messages.slice(-10), // cap context sent per request
        }),
      });
      if (!res.ok) throw new Error(`Assistant upstream error: ${res.status}`);
      return res.json();
    });

    const reply = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ reply });
  } catch (error) {
    logger.error("assistant_call_failed", { message: (error as Error).message });
    return NextResponse.json({ reply: "ORI is having trouble responding right now. Please try again shortly." }, { status: 200 });
  }
}
