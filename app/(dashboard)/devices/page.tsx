import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Laptop, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PLATFORM_ICON: Record<string, typeof Smartphone> = {
  web: Laptop,
  ios: Smartphone,
  android: Smartphone,
};

export default async function DevicesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: devices } = await supabase
    .from("devices")
    .select("*")
    .eq("owner_id", user.id)
    .order("last_seen_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Devices</h1>
        <p className="text-sm text-muted-foreground">Everything currently reporting location on your account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(devices ?? []).map((device) => {
          const Icon = PLATFORM_ICON[device.platform] ?? Smartphone;
          const isRecent = device.last_seen_at && Date.now() - new Date(device.last_seen_at).getTime() < 5 * 60 * 1000;
          return (
            <Card key={device.id}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/10 text-signal">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <p className="mono-readout capitalize">{device.platform}</p>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                <Circle className={`h-2 w-2 fill-current ${isRecent ? "text-mint" : "text-steel"}`} />
                {device.last_seen_at
                  ? `Last seen ${formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}`
                  : "Never reported"}
              </CardContent>
            </Card>
          );
        })}

        {(devices ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No devices yet — open the Map tab and allow location access to register this browser.
          </p>
        )}
      </div>
    </div>
  );
}
