import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PrivacyForm } from "@/components/settings/privacy-form";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: privacy } = await supabase.from("privacy_settings").select("*").eq("user_id", user.id).single();
  const { data: connections } = await supabase
    .from("connections")
    .select("connected_user_id, label")
    .eq("owner_id", user.id)
    .eq("status", "accepted");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, privacy, and account security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to your circle.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={profile?.full_name ?? ""} avatarUrl={profile?.avatar_url ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control exactly who sees your location, and how precisely.</CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacyForm
            initial={{
              shareLocationWith: privacy?.share_location_with ?? [],
              precision: privacy?.precision ?? "exact",
              shareWhenActive: privacy?.share_when_active ?? true,
              historyRetentionDays: privacy?.history_retention_days ?? 30,
              ghostMode: privacy?.ghost_mode ?? false,
            }}
            connections={(connections ?? []).filter((c) => c.connected_user_id) as { connected_user_id: string; label: string }[]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Add a second step at sign-in using an authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup enabled={profile?.two_factor_enabled ?? false} />
        </CardContent>
      </Card>
    </div>
  );
}
