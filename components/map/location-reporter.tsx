"use client";

import * as React from "react";
import { withRetry } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";

/**
 * Reports THIS device's own location — never another person's — using the
 * browser Geolocation API, which only ever runs after the user grants
 * permission in their browser. Pings are throttled and sent with retry/backoff
 * so flaky connections don't silently drop updates.
 */
export function LocationReporter({ userId }: { userId: string }) {
  const { toast } = useToast();
  const lastSentRef = React.useRef(0);
  const MIN_INTERVAL_MS = 5000; // cap how often we hit the network

  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < MIN_INTERVAL_MS) return;
        lastSentRef.current = now;
        void sendPing(position);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: "Location sharing is off",
            description: "Enable location permissions in your browser to share your position.",
            variant: "info",
          });
        }
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function sendPing(position: GeolocationPosition) {
    const battery = "getBattery" in navigator ? await (navigator as any).getBattery().catch(() => null) : null;

    const body = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracyMeters: position.coords.accuracy,
      capturedAt: new Date(position.timestamp).toISOString(),
      batteryPct: battery ? Math.round(battery.level * 100) : undefined,
    };

    try {
      await withRetry(async () => {
        const res = await fetch("/api/geolocation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Ping failed: ${res.status}`);
      });
    } catch {
      // Silently drop after retries — the next watchPosition tick will try again.
    }
  }

  return null;
}
