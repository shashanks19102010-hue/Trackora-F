import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, avatar_config")
    .eq("id", user.id)
    .single();

  const { data: privacy } = await supabase
    .from("privacy_settings")
    .select("ghost_mode")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Topbar
          userName={profile?.full_name ?? "Account"}
          avatarUrl={profile?.avatar_url ?? undefined}
          avatarConfig={profile?.avatar_config as never}
          ghostModeEnabled={privacy?.ghost_mode ?? false}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
