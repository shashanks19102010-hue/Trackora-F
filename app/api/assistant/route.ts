import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/utils";
import { logger } from "@/lib/logger";

const SYSTEM_PROMPT = `You are ORI, the in-app assistant for TRACKORA, a consent-based location-sharing app.
Help users navigate the app (Map, People, Devices, Notifications, Analytics, Settings, Avatar) and troubleshoot
common issues: location permission problems, invite links not working, 2FA setup, battery drain, and privacy
controls. Never claim you can locate a person who hasn't accepted an invite, and never provide guidance on
tracking someone without their consent. Keep answers short, practical, and specific to TRACKORA's features.`;

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

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { reply: "ORI isn't configured yet — add GROQ_API_KEY to your environment variables to enable live answers." },
      { status: 200 }
    );
  }

  try {
    const data = await withRetry(async () => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            // Groq uses OpenAI-style { role, content } messages, capped to
            // the last 10 turns to keep each request small and fast.
            ...messages.slice(-10).map((m: { role: string; content: string }) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          ],
        }),
      });
      if (!res.ok) throw new Error(`Assistant upstream error: ${res.status}`);
      return res.json();
    });

    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ reply });
  } catch (error) {
    logger.error("assistant_call_failed", { message: (error as Error).message });
    return NextResponse.json({ reply: "ORI is having trouble responding right now. Please try again shortly." }, { status: 200 });
  }
}
