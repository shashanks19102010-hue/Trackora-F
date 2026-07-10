import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { Bell, UserCheck, MapPin, BatteryWarning, Info } from "lucide-react";

const TYPE_ICON = {
  invite: Bell,
  invite_accepted: UserCheck,
  geofence: MapPin,
  low_battery: BatteryWarning,
  system: Info,
} as const;

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Invites, alerts, and system messages.</p>
      </div>

      <div className="space-y-2">
        {(notifications ?? []).map((n) => {
          const Icon = TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? Info;
          return (
            <div key={n.id} className={`glass-panel flex items-start gap-3 rounded-xl p-4 ${!n.read_at ? "ring-1 ring-signal/30" : ""}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              </div>
              <span className="mono-readout shrink-0">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
            </div>
          );
        })}

        {(notifications ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}
