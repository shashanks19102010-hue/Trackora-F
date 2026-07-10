"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Shuffle, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { AvatarSvg } from "@/components/avatar/avatar-svg";
import { saveAvatarConfigAction } from "@/app/(dashboard)/avatar/actions";
import type { AvatarConfig } from "@/lib/validation/schemas";

const SKIN_TONES = ["#F5D0B0", "#E8B48C", "#C68A5F", "#9B6A43", "#6B4326", "#3F2A1D"];
const HAIR_COLORS = ["#2B2320", "#5A3825", "#8C5A2B", "#C9A227", "#B5B5B5", "#D6336C", "#3D5A80"];
const BACKGROUNDS = ["#FF5533", "#3ED9A0", "#4C6EF5", "#F5A623", "#845EF7", "#0A0B0D"];

const HAIR_STYLES: AvatarConfig["hairStyle"][] = ["bald", "short", "curly", "long", "buzz", "mohawk"];
const EYE_STYLES: AvatarConfig["eyes"][] = ["round", "sleepy", "sharp", "wink"];
const MOUTH_STYLES: AvatarConfig["mouth"][] = ["smile", "neutral", "grin", "surprised"];
const ACCESSORIES: AvatarConfig["accessory"][] = ["none", "glasses", "sunglasses", "cap"];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function AvatarBuilder({ initial }: { initial: AvatarConfig }) {
  const [config, setConfig] = useState<AvatarConfig>(initial);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function update<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function randomize() {
    setConfig({
      skinTone: randomOf(SKIN_TONES),
      hairStyle: randomOf(HAIR_STYLES),
      hairColor: randomOf(HAIR_COLORS),
      eyes: randomOf(EYE_STYLES),
      mouth: randomOf(MOUTH_STYLES),
      accessory: randomOf(ACCESSORIES),
      backgroundColor: randomOf(BACKGROUNDS),
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveAvatarConfigAction(config);
      toast({
        title: result.success ? "Avatar saved" : "Couldn't save",
        description: result.message,
        variant: result.success ? "success" : "error",
      });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit lg:sticky lg:top-24">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <motion.div key={JSON.stringify(config)} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}>
            <AvatarSvg config={config} size={180} />
          </motion.div>
          <div className="flex w-full gap-2">
            <Button variant="secondary" className="flex-1" onClick={randomize} type="button">
              <Shuffle className="h-4 w-4" /> Shuffle
            </Button>
            <Button className="flex-1" onClick={save} loading={isPending} type="button">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <OptionRow label="Skin tone" colors={SKIN_TONES} active={config.skinTone} onPick={(c) => update("skinTone", c)} />

        <div>
          <p className="mb-2 text-sm font-medium">Hair style</p>
          <div className="flex flex-wrap gap-2">
            {HAIR_STYLES.map((style) => (
              <ChoiceButton key={style} active={config.hairStyle === style} onClick={() => update("hairStyle", style)}>
                {style}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <OptionRow label="Hair color" colors={HAIR_COLORS} active={config.hairColor} onPick={(c) => update("hairColor", c)} />

        <div>
          <p className="mb-2 text-sm font-medium">Eyes</p>
          <div className="flex flex-wrap gap-2">
            {EYE_STYLES.map((style) => (
              <ChoiceButton key={style} active={config.eyes === style} onClick={() => update("eyes", style)}>
                {style}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Mouth</p>
          <div className="flex flex-wrap gap-2">
            {MOUTH_STYLES.map((style) => (
              <ChoiceButton key={style} active={config.mouth === style} onClick={() => update("mouth", style)}>
                {style}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Accessory</p>
          <div className="flex flex-wrap gap-2">
            {ACCESSORIES.map((style) => (
              <ChoiceButton key={style} active={config.accessory === style} onClick={() => update("accessory", style)}>
                {style}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <OptionRow
          label="Background"
          colors={BACKGROUNDS}
          active={config.backgroundColor}
          onPick={(c) => update("backgroundColor", c)}
        />
      </div>
    </div>
  );
}

function OptionRow({
  label,
  colors,
  active,
  onPick,
}: {
  label: string;
  colors: string[];
  active: string;
  onPick: (color: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onPick(color)}
            style={{ backgroundColor: color }}
            className={`h-9 w-9 rounded-full transition-transform ${
              active === color ? "scale-110 ring-2 ring-signal ring-offset-2 ring-offset-background" : ""
            }`}
            aria-label={`Choose ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
        active ? "bg-signal text-white" : "bg-secondary text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
