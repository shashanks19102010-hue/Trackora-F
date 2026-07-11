"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { Navigation, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { withRetry } from "@/lib/utils";

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

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India-centered default

// CartoDB's free "dark matter" tiles — no API key needed, matches the
// Nothing-OS-inspired dark theme used elsewhere in the app.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Public OSRM demo server — free, no key, fine for personal/demo traffic.
// For heavy production use, swap this for a self-hosted OSRM instance or a
// paid routing provider; see README.
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

function signalDivIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:16px;height:16px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.55;animation:signalPulse 2.4s cubic-bezier(.2,.6,.4,1) infinite;"></span>
        <span style="position:absolute;inset:3px;border-radius:9999px;background:${color};box-shadow:0 0 0 2px rgba(255,255,255,0.85);"></span>
      </div>
      <style>
        @keyframes signalPulse { 0% { transform: scale(0.9); opacity:.7 } 70% { transform: scale(2.4); opacity:0 } 100% { opacity:0 } }
      </style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function RecenterOnTarget({ position }: { position: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 0.6 });
  }, [position, map]);
  return null;
}

export function LiveMap({
  people,
  selfUserId,
  targetUserId,
}: {
  people: Person[];
  selfUserId: string;
  targetUserId?: string;
}) {
  const [livePeople, setLivePeople] = React.useState(people);
  const [selfPosition, setSelfPosition] = React.useState<[number, number] | null>(null);
  const [route, setRoute] = React.useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = React.useState<{ distanceKm: string; durationMin: string } | null>(null);
  const [activeTarget, setActiveTarget] = React.useState<string | undefined>(targetUserId);

  // Subscribe to new pings in real time so markers move the instant someone's
  // location updates — no polling, no page refresh.
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("location-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "location_pings" },
        (payload) => {
          const row = payload.new as PersonLocation;
          setLivePeople((prev) => prev.map((p) => (p.id === row.owner_id ? { ...p, location: row } : p)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selfUserId]);

  // Track our own live position client-side so directions always start from
  // "right here" — this is never written anywhere from this screen.
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setSelfPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const withLocation = livePeople.filter((p) => p.location);
  const target = activeTarget ? withLocation.find((p) => p.id === activeTarget) : undefined;

  // Fetch a free driving route from OSRM whenever we have both an origin and
  // a chosen target — retried once on transient network failures.
  React.useEffect(() => {
    if (!selfPosition || !target?.location) {
      setRoute(null);
      setRouteInfo(null);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const url = `${OSRM_BASE_URL}/${selfPosition[1]},${selfPosition[0]};${target.location!.lng},${target.location!.lat}?overview=full&geometries=geojson`;
        const data = await withRetry(
          async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Routing failed: ${res.status}`);
            return res.json();
          },
          { retries: 1 }
        );

        if (cancelled) return;
        const leg = data.routes?.[0];
        if (leg) {
          const coords: [number, number][] = leg.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
          setRoute(coords);
          setRouteInfo({
            distanceKm: (leg.distance / 1000).toFixed(1),
            durationMin: Math.round(leg.duration / 60).toString(),
          });
        }
      } catch {
        if (!cancelled) {
          setRoute(null);
          setRouteInfo(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selfPosition, target?.location?.lat, target?.location?.lng]);

  const center: [number, number] = target?.location
    ? [target.location.lat, target.location.lng]
    : withLocation[0]?.location
    ? [withLocation[0].location!.lat, withLocation[0].location!.lng]
    : DEFAULT_CENTER;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={withLocation.length ? 11 : 4}
        style={{ width: "100%", height: "100%", background: "#0e1013" }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <RecenterOnTarget position={target?.location ? [target.location.lat, target.location.lng] : null} />

        {withLocation.map((person) => (
          <Marker
            key={person.id}
            position={[person.location!.lat, person.location!.lng]}
            icon={signalDivIcon(activeTarget === person.id ? "#3ED9A0" : "#FF5533")}
            eventHandlers={{ click: () => setActiveTarget(person.id) }}
          />
        ))}

        {route && <Polyline positions={route} pathOptions={{ color: "#FF5533", weight: 4, opacity: 0.85 }} />}
      </MapContainer>

      {target && routeInfo && (
        <div className="glass-panel absolute left-4 top-4 flex items-center gap-3 rounded-xl px-4 py-3">
          <Navigation className="h-4 w-4 text-signal" />
          <div className="text-sm">
            <p className="font-medium">
              To {target.name}: {routeInfo.distanceKm} km · ~{routeInfo.durationMin} min
            </p>
            <p className="mono-readout">Driving route via OSRM (open-source, free)</p>
          </div>
          <button
            onClick={() => setActiveTarget(undefined)}
            aria-label="Clear directions"
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="glass-panel absolute right-4 top-4 rounded-xl px-3 py-2 text-xs text-muted-foreground">
        Tap a pin to select someone, or use Directions from People.
      </div>

      {withLocation.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <p className="glass-panel rounded-full px-4 py-2 text-xs text-muted-foreground">
            Nobody's sharing their location with you yet — invite someone from People.
          </p>
        </div>
      )}
    </div>
  );
}
