"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

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

export function RadarMap({
  markers,
  center,
  radius,
  onCenterChange,
}: {
  markers: MarkerData[];
  center: [number, number];
  radius: number;
  onCenterChange?: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (mapInstance.current) return;
    let map: any = null;

    async function init() {
      const L = await import("leaflet");
      if (!mapRef.current || mapInstance.current) return;

      const m = L.map(mapRef.current, {
        center,
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(m);

      m.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        onCenterChange?.(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = m;
      map = m;
      setReady(true);
    }
    init();

    return () => {
      if (map) map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update overlays (markers + circle)
  useEffect(() => {
    if (!mapInstance.current || !ready) return;
    const map = mapInstance.current;
    import("leaflet").then((L) => {
      // Clear old overlays
      overlaysRef.current.forEach((layer) => layer.remove());
      overlaysRef.current = [];
      const layers: ReturnType<typeof L.layerGroup>[] = [];

      // Radius circle
      const circle = L.circle(center, {
        radius: radius * 1000,
        color: "#36BCCB",
        fillColor: "#36BCCB",
        fillOpacity: 0.05,
        weight: 1,
        opacity: 0.3,
      });
      circle.addTo(map);
      overlaysRef.current.push(circle);

      // Markers
      const colors: Record<string, string> = {
        orbit: "#36BCCB",
        user: "#F9FF54",
        event: "#FF8D23",
      };

      markers.forEach((m) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: 32px; height: 32px;
            background: ${colors[m.type] || "#36BCCB"};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold; color: #000;
          ">${m.type === "orbit" ? "O" : m.type === "user" ? "U" : "E"}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([m.lat, m.lng], { icon });
        marker.bindPopup(`
          <div style="min-width: 180px;">
            <h3 style="font-weight: 700; font-size: 14px; margin: 0 0 4px;">${m.title}</h3>
            <p style="font-size: 12px; color: #666; margin: 0 0 8px;">${m.subtitle}</p>
            <a href="${m.href}" style="font-size: 12px; color: #36BCCB; text-decoration: none; font-weight: 500;">View details →</a>
          </div>
        `);
        marker.addTo(map);
        overlaysRef.current.push(marker);
      });
    });
  }, [markers, center, radius, ready]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-raised z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading radar map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
