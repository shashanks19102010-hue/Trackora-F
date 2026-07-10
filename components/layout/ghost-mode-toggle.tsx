"use client";

import { useState, useTransition } from "react";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { toggleGhostModeAction } from "@/app/(dashboard)/settings/actions";

export function GhostModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function toggle() {
    const next = !enabled;
    setEnabled(next); // optimistic — feels instant, which matters for a "stop sharing now" control
    startTransition(async () => {
      const result = await toggleGhostModeAction(next);
      if (!result.success) {
        setEnabled(!next);
        toast({ title: "Couldn't update ghost mode", variant: "error" });
        return;
      }
      toast({
        title: next ? "Ghost mode on" : "Ghost mode off",
        description: next ? "Nobody can see your location right now." : "Your location is visible to your circle again.",
        variant: next ? "info" : "success",
      });
    });
  }

  return (
    <Button
      variant={enabled ? "default" : "ghost"}
      size="sm"
      onClick={toggle}
      loading={isPending}
      aria-pressed={enabled}
      title="Instantly hide your location from everyone"
    >
      <Ghost className="h-4 w-4" />
      {enabled ? "Ghosting" : "Ghost mode"}
    </Button>
  );
}
