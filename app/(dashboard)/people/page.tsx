import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "@/components/people/invite-form";
import { ConnectionsListWrapper } from "@/components/people/connections-list-wrapper";

export default async function PeoplePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sentInvites } = await supabase
    .from("connections")
    .select("id, label, relationship, status, connected_user_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: receivedConnections } = await supabase
    .from("connections")
    .select("id, label, relationship, status, owner:profiles!connections_owner_id_fkey(full_name)")
    .eq("connected_user_id", user.id)
    .eq("status", "accepted")
    .order("responded_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">People</h1>
        <p className="text-sm text-muted-foreground">
          Nobody appears on your map until they open your link and accept. Revoke access anytime.
        </p>
      </div>

      <InviteForm />

      <ConnectionsListWrapper
        incoming={(receivedConnections ?? []) as never}
        outgoing={(sentInvites ?? []) as never}
      />
    </div>
  );
}
