"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withRetry } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why isn't my location showing on the map?",
  "How do I invite a family member?",
  "How do I turn on two-factor authentication?",
  "My invite never arrived — what do I check?",
];

export function OriChat() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: "assistant", content: "Hi, I'm ORI. Ask me anything about setting up TRACKORA or fixing an issue." },
  ]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || isSending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setIsSending(true);

    try {
      const data = await withRetry(async () => {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        if (!res.ok) throw new Error("assistant request failed");
        return res.json();
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't reach the assistant service. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="glass-panel flex flex-1 flex-col overflow-hidden rounded-2xl">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-signal text-white" : "bg-secondary text-foreground"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-signal">
                    <Sparkles className="h-3 w-3" /> ORI
                  </div>
                )}
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isSending && <p className="mono-readout">ORI is thinking…</p>}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ORI something…"
          className="flex-1 rounded-xl bg-secondary/60 px-4 py-2.5 text-sm outline-none focus-ring"
        />
        <Button type="submit" size="icon" loading={isSending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
