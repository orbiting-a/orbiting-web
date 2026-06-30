"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  getNearbyOrbits,
  getNearbyUsers,
  getNearbyEvents,
} from "@/lib/supabase/queries";
import { ChakraFilter } from "@/components/radar/ChakraFilter";
import { MapPin, Navigation, Loader2 } from "lucide-react";

const RadarMap = dynamic(
  () => import("@/components/radar/RadarMap").then((m) => m.RadarMap),
  { ssr: false, loading: () => <MapLoading /> }
);

function MapLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-surface-raised">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-brand-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">Loading radar...</p>
      </div>
    </div>
  );
}

type MarkerData = {
  id: string;
  type: "orbit" | "user" | "event";
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  image?: string | null;
  href: string;
};

export default function RadarPage() {
  const [position, setPosition] = useState<[number, number]>([28.6139, 77.209]);
  const [radius, setRadius] = useState(100);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [activeTypes, setActiveTypes] = useState(["orbits", "people", "events"]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [locationError, setLocationError] = useState("");

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setLocationError("Using default location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch nearby data
  useEffect(() => {
    async function load() {
      const [lat, lng] = position;

      const promises: Promise<MarkerData[]>[] = [];
      if (activeTypes.includes("orbits")) {
        promises.push(
          getNearbyOrbits(lat, lng, radius).then((orbits) =>
            orbits.map((o) => ({
              id: o.id,
              type: "orbit" as const,
              lat: (o.location as { lat: number })?.lat ?? 0,
              lng: (o.location as { lng: number })?.lng ?? 0,
              title: o.name,
              subtitle: `${o.member_count} members · ${o.category || "General"}`,
              image: o.logo_url,
              href: `/orbit/${o.slug}`,
            }))
          )
        );
      }
      if (activeTypes.includes("people")) {
        promises.push(
          getNearbyUsers(lat, lng, radius).then((users) =>
            users.map((u) => ({
              id: u.id,
              type: "user" as const,
              lat: (u.location as { lat: number })?.lat ?? 0,
              lng: (u.location as { lng: number })?.lng ?? 0,
              title: u.display_name || u.username,
              subtitle: `@${u.username}`,
              image: u.avatar_url,
              href: `/profile/${u.id}`,
            }))
          )
        );
      }
      if (activeTypes.includes("events")) {
        promises.push(
          getNearbyEvents(lat, lng, radius).then((events) =>
            events.map((e) => ({
              id: e.id,
              type: "event" as const,
              lat: (e.location as { lat: number })?.lat ?? 0,
              lng: (e.location as { lng: number })?.lng ?? 0,
              title: e.title,
              subtitle: new Date(e.starts_at).toLocaleDateString(),
              image: e.cover_url,
              href: "#",
            }))
          )
        );
      }

      const results = await Promise.all(promises);
      setMarkers(results.flat());
    }
    load();
  }, [position, radius, activeTypes]);

  const handleRecenter = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {}
    );
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] w-full flex items-center justify-center bg-surface-raised">
        <MapLoading />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full relative">
      <RadarMap
        markers={markers}
        center={position}
        radius={radius}
        onCenterChange={(lat, lng) => setPosition([lat, lng])}
      />

      <ChakraFilter
        radius={radius}
        onRadiusChange={setRadius}
        activeTypes={activeTypes}
        onTypesChange={setActiveTypes}
      />

      {/* Re-center button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-20 right-4 z-[1000] h-10 w-10 rounded-full bg-surface-raised border border-border-subtle shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        aria-label="Re-center"
      >
        <Navigation className="h-4 w-4" />
      </button>

      {/* Location info */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-surface-raised/90 backdrop-blur-sm border border-border-subtle rounded-xl px-3 py-2">
        <MapPin className="h-3.5 w-3.5 text-brand-400" />
        <span className="text-xs text-text-muted">
          {position[0].toFixed(2)}, {position[1].toFixed(2)}
        </span>
      </div>

      {/* Marker count */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-surface-raised/90 backdrop-blur-sm border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-muted">
        {markers.length} entities found
      </div>
    </div>
  );
}
