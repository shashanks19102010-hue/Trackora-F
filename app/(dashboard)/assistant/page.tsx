import { OriChat } from "@/components/assistant/ori-chat";

export default function AssistantPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold">ORI</h1>
        <p className="text-sm text-muted-foreground">Your assistant for troubleshooting and getting around TRACKORA.</p>
      </div>
      <OriChat />
    </div>
  );
}
