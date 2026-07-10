"use client";

import * as React from "react";
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from "@react-google-maps/api";
import { formatDistanceToNow } from "date-fns";
import { Navigation, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCoordinate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India-centered default
const MAP_LIBRARIES: "places"[] = ["places"];

// Nothing-OS-inspired dark map theme — desaturated, high-contrast labels.
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0e1013" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e1013" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b92a3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c1f24" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0c10" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

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
  const [selfPosition, setSelfPosition] = React.useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = React.useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = React.useState<{ distance: string; duration: string } | null>(null);
  const [activeTarget, setActiveTarget] = React.useState<string | undefined>(targetUserId);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    id: "trackora-map",
    libraries: MAP_LIBRARIES,
  });

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
          setLivePeople((prev) =>
            prev.map((p) => (p.id === row.owner_id ? { ...p, location: row } : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selfUserId]);

  // Track our own live position client-side so directions always start from
  // "right here" — this never gets written anywhere else on this screen.
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setSelfPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const withLocation = livePeople.filter((p) => p.location);
  const target = activeTarget ? withLocation.find((p) => p.id === activeTarget) : undefined;

  // Compute directions whenever we have both an origin and a chosen target.
  React.useEffect(() => {
    if (!isLoaded || !selfPosition || !target?.location) {
      setDirections(null);
      setRouteInfo(null);
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: selfPosition,
        destination: { lat: target.location.lat, lng: target.location.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) setRouteInfo({ distance: leg.distance?.text ?? "", duration: leg.duration?.text ?? "" });
        } else {
          setDirections(null);
          setRouteInfo(null);
        }
      }
    );
  }, [isLoaded, selfPosition, target?.location?.lat, target?.location?.lng]);

  const center = target?.location
    ? { lat: target.location.lat, lng: target.location.lng }
    : withLocation[0]?.location
    ? { lat: withLocation[0].location!.lat, lng: withLocation[0].location!.lng }
    : DEFAULT_CENTER;

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables to enable the live map.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex h-full animate-pulse items-center justify-center bg-secondary/40 text-sm text-muted-foreground">Loading map…</div>;
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={target ? 13 : withLocation.length ? 11 : 4}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {withLocation.map((person) => (
          <OverlayView
            key={person.id}
            position={{ lat: person.location!.lat, lng: person.location!.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <SignalPin
              person={person}
              onNavigate={() => setActiveTarget(person.id)}
              isActiveTarget={activeTarget === person.id}
            />
          </OverlayView>
        ))}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: "#FF5533", strokeWeight: 4, strokeOpacity: 0.85 },
            }}
          />
        )}
      </GoogleMap>

      {target && routeInfo && (
        <div className="glass-panel absolute left-4 top-4 flex items-center gap-3 rounded-xl px-4 py-3">
          <Navigation className="h-4 w-4 text-signal" />
          <div className="text-sm">
            <p className="font-medium">
              To {target.name}: {routeInfo.distance} · {routeInfo.duration}
            </p>
            <p className="mono-readout">Driving directions, live-updated</p>
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
    </div>
  );
}

function SignalPin({
  person,
  onNavigate,
  isActiveTarget,
}: {
  person: Person;
  onNavigate: () => void;
  isActiveTarget: boolean;
}) {
  if (!person.location) return null;
  return (
    <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center">
      <div className="glass-panel mb-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-fog shadow-lg">
        <div className="flex items-center gap-2">
          <span>{person.name}</span>
          <button
            onClick={onNavigate}
            className={`rounded-full p-1 transition-colors ${isActiveTarget ? "bg-signal text-white" : "bg-white/10 hover:bg-white/20"}`}
            aria-label={`Get directions to ${person.name}`}
            title="Get directions"
          >
            <Navigation className="h-3 w-3" />
          </button>
        </div>
        <div className="mono-readout mt-0.5">
          {formatCoordinate(person.location.lat)}, {formatCoordinate(person.location.lng)} ·{" "}
          {formatDistanceToNow(new Date(person.location.captured_at), { addSuffix: true })}
        </div>
      </div>
      <div className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-signal-pulse rounded-full bg-signal" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-signal ring-2 ring-white/80" />
      </div>
    </div>
  );
}

