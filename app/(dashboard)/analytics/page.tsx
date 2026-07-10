import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityChart } from "@/components/analytics/activity-chart";
import { subDays, format } from "date-fns";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = subDays(new Date(), 14).toISOString();
  const { data: pings } = await supabase
    .from("location_pings")
    .select("captured_at, accuracy_meters")
    .eq("owner_id", user.id)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });

  const { count: deviceCount } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: connectionCount } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("status", "accepted");

  // Bucket pings per day for the last 14 days.
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    buckets.set(format(subDays(new Date(), i), "MMM d"), 0);
  }
  for (const p of pings ?? []) {
    const key = format(new Date(p.captured_at), "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const avgAccuracy =
    pings && pings.length
      ? Math.round(pings.reduce((sum, p) => sum + (p.accuracy_meters ?? 0), 0) / pings.length)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">How your account has been tracking over the last two weeks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pings (14d)" value={(pings ?? []).length.toLocaleString()} />
        <StatCard label="Avg. accuracy" value={`${avgAccuracy} m`} />
        <StatCard label="Active connections" value={String(connectionCount ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily location pings</CardTitle>
          <CardDescription>Across {deviceCount ?? 0} registered device(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart data={Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
