"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { updatePrivacyAction } from "@/app/(dashboard)/settings/actions";

type Precision = "exact" | "approximate" | "city-only";

interface Props {
  initial: {
    shareLocationWith: string[];
    precision: Precision;
    shareWhenActive: boolean;
    historyRetentionDays: number;
    ghostMode: boolean;
  };
  connections: { connected_user_id: string; label: string }[];
}

const PRECISION_OPTIONS: { value: Precision; label: string; hint: string }[] = [
  { value: "exact", label: "Exact", hint: "Precise GPS coordinates" },
  { value: "approximate", label: "Approximate", hint: "Rounded to ~500m" },
  { value: "city-only", label: "City only", hint: "Just your city name" },
];

export function PrivacyForm({ initial, connections }: Props) {
  const [shareWith, setShareWith] = useState<string[]>(initial.shareLocationWith);
  const [precision, setPrecision] = useState<Precision>(initial.precision);
  const [shareWhenActive, setShareWhenActive] = useState(initial.shareWhenActive);
  const [retention, setRetention] = useState(initial.historyRetentionDays);
  const [ghostMode, setGhostMode] = useState(initial.ghostMode);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function toggle(id: string) {
    setShareWith((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function save() {
    startTransition(async () => {
      const result = await updatePrivacyAction({
        shareLocationWith: shareWith,
        precision,
        shareWhenActive,
        historyRetentionDays: retention,
        ghostMode,
      });
      toast({
        title: result.success ? "Privacy settings saved" : "Couldn't save",
        variant: result.success ? "success" : "error",
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-signal/30 bg-signal/5 p-4">
        <div>
          <p className="text-sm font-medium">Ghost mode</p>
          <p className="text-xs text-muted-foreground">Instantly hide your location from everyone, without revoking any connection.</p>
        </div>
        <Switch checked={ghostMode} onCheckedChange={setGhostMode} />
      </div>
      <div>
        <Label className="mb-2 block">Share my location with</Label>
        <div className="flex flex-wrap gap-2">
          {connections.length === 0 && <p className="text-sm text-muted-foreground">No accepted connections yet.</p>}
          {connections.map((c) => (
            <button
              key={c.connected_user_id}
              onClick={() => toggle(c.connected_user_id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                shareWith.includes(c.connected_user_id) ? "bg-signal text-white" : "bg-secondary text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Precision</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRECISION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPrecision(opt.value)}
              className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                precision === opt.value ? "border-signal bg-signal/10" : "border-border"
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium">Only share while app is active</p>
          <p className="text-xs text-muted-foreground">Pause sharing automatically when TRACKORA is closed.</p>
        </div>
        <Switch checked={shareWhenActive} onCheckedChange={setShareWhenActive} />
      </div>

      <div>
        <Label htmlFor="retention" className="mb-2 block">
          Keep route history for {retention} days
        </Label>
        <input
          id="retention"
          type="range"
          min={1}
          max={365}
          value={retention}
          onChange={(e) => setRetention(Number(e.target.value))}
          className="w-full accent-signal"
        />
      </div>

      <Button onClick={save} loading={isPending}>
        Save privacy settings
      </Button>
    </div>
  );
}
