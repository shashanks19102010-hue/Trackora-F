"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, which breaks Next.js's server
// render of Client Components unless it's excluded from SSR entirely. This
// wrapper is the one place that happens — the actual map component stays a
// normal, clean Client Component.
const LiveMap = dynamic(() => import("./live-map").then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full animate-pulse items-center justify-center bg-secondary/40 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

interface PersonLocation {
  owner_id: string;
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  captured_at: string;
}

interface Person {
  id: string;
  name: string;
  avatarUrl: string | null;
  location: PersonLocation | null;
}

export function LiveMapLoader(props: { people: Person[]; selfUserId: string; targetUserId?: string }) {
  return <LiveMap {...props} />;
}
