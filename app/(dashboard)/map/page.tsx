import { createClient } from "@/lib/supabase/server";
import { LiveMap } from "@/components/map/live-map";
import { LocationReporter } from "@/components/map/location-reporter";

export default async function MapPage({ searchParams }: { searchParams: { to?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Only connections both sides have accepted are ever fetched here — RLS
  // enforces this server-side too, so this query can't return anyone else.
  const { data: connections } = await supabase
    .from("connections")
    .select("id, connected_user_id, owner_id, label, status")
    .eq("status", "accepted")
    .or(`owner_id.eq.${user.id},connected_user_id.eq.${user.id}`);

  const peerIds =
    connections?.map((c) => (c.owner_id === user.id ? c.connected_user_id : c.owner_id)).filter(Boolean) ?? [];

  const { data: profiles } = peerIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", peerIds as string[])
    : { data: [] };

  const { data: latestPings } = peerIds.length
    ? await supabase
        .from("location_pings")
        .select("owner_id, lat, lng, accuracy_meters, captured_at")
        .in("owner_id", peerIds as string[])
        .order("captured_at", { ascending: false })
    : { data: [] };

  // Reduce to the single most recent ping per person.
  const latestByOwner = new Map<string, (typeof latestPings)[number]>();
  for (const ping of latestPings ?? []) {
    if (!latestByOwner.has(ping.owner_id)) latestByOwner.set(ping.owner_id, ping);
  }

  const people = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name,
    avatarUrl: p.avatar_url,
    location: latestByOwner.get(p.id) ?? null,
  }));

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Map</h1>
        <p className="text-sm text-muted-foreground">Live positions for everyone in your circle who's shared with you.</p>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border">
        <LiveMap people={people} selfUserId={user.id} targetUserId={searchParams?.to} />
      </div>
      <LocationReporter userId={user.id} />
    </div>
  );
}
