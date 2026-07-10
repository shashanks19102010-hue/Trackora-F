import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { locationPingSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

// Ingests a location ping for the CALLER'S OWN account only. deviceId must
// belong to the authenticated user — enforced both here and by RLS — so this
// endpoint can never be used to write a ping on someone else's behalf.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  // Resolve (or lazily create) this user's primary "web" device rather than
  // trusting a client-supplied deviceId blindly.
  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("owner_id", user.id)
    .eq("platform", "web")
    .maybeSingle();

  let deviceId = device?.id;
  if (!deviceId) {
    const { data: created, error: createError } = await supabase
      .from("devices")
      .insert({ owner_id: user.id, name: "Browser", platform: "web" })
      .select("id")
      .single();
    if (createError || !created) {
      logger.error("device_create_failed", { message: createError?.message });
      return NextResponse.json({ error: "Could not register device" }, { status: 500 });
    }
    deviceId = created.id;
  }

  const parsed = locationPingSchema.safeParse({ ...body, deviceId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("location_pings").insert({
    device_id: parsed.data.deviceId,
    owner_id: user.id,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    accuracy_meters: parsed.data.accuracyMeters,
    battery_pct: parsed.data.batteryPct,
    captured_at: parsed.data.capturedAt,
  });

  if (insertError) {
    logger.error("ping_insert_failed", { message: insertError.message });
    return NextResponse.json({ error: "Could not save location" }, { status: 500 });
  }

  await supabase.from("devices").update({ last_seen_at: new Date().toISOString() }).eq("id", deviceId);

  return NextResponse.json({ success: true });
}
