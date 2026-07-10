import { createClient } from "@/lib/supabase/server";
import { AvatarBuilder } from "@/components/avatar/avatar-builder";
import type { AvatarConfig } from "@/lib/validation/schemas";

const DEFAULT_CONFIG: AvatarConfig = {
  skinTone: "#E8B48C",
  hairStyle: "short",
  hairColor: "#2B2320",
  eyes: "round",
  mouth: "smile",
  accessory: "none",
  backgroundColor: "#FF5533",
};

export default async function AvatarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("avatar_config").eq("id", user.id).single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Build your avatar</h1>
        <p className="text-sm text-muted-foreground">Design how you show up on the map — no photo needed.</p>
      </div>
      <AvatarBuilder initial={(profile?.avatar_config as AvatarConfig | null) ?? DEFAULT_CONFIG} />
    </div>
  );
}
