"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Textarea, Button } from "@/components/ui";
import { LocationSearch } from "@/components/ui/LocationSearch";
import type { LocationResult } from "@/components/ui/LocationSearch";
import { Calendar, MapPin, Navigation, Orbit as OrbitIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Channel } from "@/types/database";

export default function CreateActivityPage() {
  const router = useRouter();
  const supabase = createClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const userDotRef = useRef<any>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [locName, setLocName] = useState("");
  const [orbitId, setOrbitId] = useState("");
  const [orbits, setOrbits] = useState<{ id: string; name: string }[]>([]);
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    async function loadOrbits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("orbit_members")
        .select("orbits(id, name)")
        .eq("user_id", user.id);
      if (data) {
        setOrbits(data.map((d: unknown) => (d as { orbits: { id: string; name: string } }).orbits));
      }
    }
    loadOrbits();
  }, [supabase]);

  // Get user's current location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        if (!markerRef.current) {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Sync location search selection with map marker
  useEffect(() => {
    if (!location || !markerRef.current || !mapInstance.current) return;
    setLat(location.lat);
    setLng(location.lng);
    markerRef.current.setLatLng([location.lat, location.lng]);
    mapInstance.current.setView([location.lat, location.lng], 12);
  }, [location]);

  // Init mini map for location picking
  useEffect(() => {
    if (mapInstance.current) return;
    const el = mapRef.current;
    if (!el) return;
    (async () => {
      const L = await import("leaflet");
      const m = L.map(el, {
        center: [lat, lng],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(m);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(m);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        setLocation(null);
      });
      m.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        setLocation(null);
      });
      mapInstance.current = m;
      markerRef.current = marker;
      setMapReady(true);
    })();
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  // Add/update red dot for user's current location
  useEffect(() => {
    if (!mapReady || userLat === null || userLng === null) return;
    (async () => {
      const L = await import("leaflet");
      if (userDotRef.current) {
        userDotRef.current.setLatLng([userLat, userLng]);
      } else {
        userDotRef.current = L.circleMarker([userLat, userLng], {
          radius: 8,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.4,
          weight: 2,
          interactive: false,
        }).addTo(mapInstance.current);
      }
    })();
  }, [mapReady, userLat, userLng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        if (markerRef.current && mapInstance.current) {
          markerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude]);
          mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 10);
        }
      },
      () => {}
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbitId) { setError("Please select an orbit"); return; }
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setSubmitting(false); return; }

    const { error: err } = await supabase.from("events").insert({
      orbit_id: orbitId,
      title: title.trim(),
      description: desc.trim() || null,
      location: { lat, lng, city: locName.trim(), country: "" },
      starts_at: new Date(date).toISOString(),
      created_by: user.id,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Create Activity</h1>
        <p className="text-sm text-text-secondary">Host a meetup or event in your orbit</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Orbit</label>
            <select
              value={orbitId}
              onChange={(e) => setOrbitId(e.target.value)}
              className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">Select an orbit...</option>
              {orbits.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Activity Title"
            placeholder="e.g. Saturday Pizza Party Meetup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="What will we do? Bring anything?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
          />

          <Input
            label="Date & Time"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            icon={<Calendar className="h-4 w-4" />}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Location
            </label>
            <LocationSearch value={location} onChange={setLocation} placeholder="Search for a place..." />
          </div>

          <Input
            label="Location Name"
            placeholder="e.g. Campus Central Park"
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
            icon={<MapPin className="h-4 w-4" />}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Pick on Map
            </label>
            <div className="relative h-48 rounded-xl overflow-hidden border border-border-subtle">
              <div ref={mapRef} className="h-full w-full" />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-raised text-xs text-text-muted">
                  Loading map...
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-text-muted">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
              <button
                type="button"
                onClick={useMyLocation}
                className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300"
              >
                <Navigation className="h-3 w-3" /> Use my location
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" loading={submitting}>
              Create Event
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
