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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(100);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [activeTypes, setActiveTypes] = useState(["orbits", "people", "events"]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [locationError, setLocationError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | "unsupported">("prompt");

  // Search box state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus("unsupported");
      setLoading(false);
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((status) => {
        setPermissionStatus(status.state);
        status.onchange = () => {
          setPermissionStatus(status.state);
        };
      });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setPosition(coords);
        setPermissionStatus("granted");
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionStatus("denied");
        } else {
          setLocationError("Using default location");
        }
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
    if (userLocation) {
      setPosition(userLocation);
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setPosition(coords);
        setPermissionStatus("granted");
      },
      () => {}
    );
  }, [userLocation]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] w-full flex items-center justify-center bg-surface-raised">
        <MapLoading />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full relative">
      {/* Geolocation permission warning */}
      {permissionStatus === "denied" && (
        <div className="absolute top-16 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-[1001] bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-sm animate-fade-in">
          <span>Location permission denied. Please allow browser location access.</span>
          <button
            onClick={() => {
              setLoading(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                  setUserLocation(coords);
                  setPosition(coords);
                  setPermissionStatus("granted");
                  setLoading(false);
                },
                () => {
                  setPermissionStatus("denied");
                  setLoading(false);
                }
              );
            }}
            className="shrink-0 bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Nominatim Search Bar */}
      <form onSubmit={handleSearch} className="absolute top-4 left-20 right-32 md:left-24 md:right-48 z-[1000] flex flex-col gap-1 max-w-sm">
        <div className="flex gap-2 bg-surface-raised/90 backdrop-blur-sm border border-border-subtle rounded-xl p-1 shadow-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city or place..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm placeholder:text-text-muted focus:outline-none text-text-primary"
          />
          <button type="submit" className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-colors">
            {searching ? "..." : "Search"}
          </button>
        </div>
        {showSearchResults && searchResults.length > 0 && (
          <div className="bg-surface-raised border border-border-subtle rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1 p-1">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const lat = parseFloat(r.lat);
                  const lon = parseFloat(r.lon);
                  setPosition([lat, lon]);
                  setShowSearchResults(false);
                  setSearchQuery("");
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg truncate border-b border-border-subtle last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </form>

      <RadarMap
        markers={markers}
        center={position}
        radius={radius}
        onCenterChange={(lat, lng) => setPosition([lat, lng])}
        userLocation={userLocation}
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
