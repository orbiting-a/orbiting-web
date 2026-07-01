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
  userLocation,
}: {
  markers: MarkerData[];
  center: [number, number];
  radius: number;
  onCenterChange?: (lat: number, lng: number) => void;
  userLocation: [number, number] | null;
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
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark-themed tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(m);

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(m);

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

  // Re-center when position changes
  useEffect(() => {
    if (!mapInstance.current || !ready) return;
    mapInstance.current.setView(center, mapInstance.current.getZoom() || 12);
  }, [center[0], center[1], ready]);

  // Update overlays (markers + circle)
  useEffect(() => {
    if (!mapInstance.current || !ready) return;
    const map = mapInstance.current;
    import("leaflet").then((L) => {
      // Clear old overlays
      overlaysRef.current.forEach((layer) => layer.remove());
      overlaysRef.current = [];

      // Radius circle centered on user location (or search center fallback)
      const circleCenter = userLocation || center;
      const circle = L.circle(circleCenter, {
        radius: radius * 1000,
        color: "#36BCCB",
        fillColor: "#36BCCB",
        fillOpacity: 0.06,
        weight: 1.5,
        opacity: 0.4,
        dashArray: "6 4",
      });
      circle.addTo(map);
      overlaysRef.current.push(circle);

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(54,188,203,0.12);animation:radar-pulse 2s ease-out infinite"></div>
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(54,188,203,0.2);animation:radar-pulse 2s ease-out infinite 0.4s"></div>
            <div style="width:14px;height:14px;border-radius:50%;background:#36BCCB;border:3px solid #fff;box-shadow:0 0 16px rgba(54,188,203,0.7),0 2px 6px rgba(0,0,0,0.3)"></div>
          </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        const userMarker = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 });
        userMarker.bindPopup(`
          <div style="min-width:120px;text-align:center;padding:4px 0;">
            <h3 style="font-weight:700;font-size:13px;margin:0 0 2px;color:#36BCCB;">You are here</h3>
            <p style="font-size:11px;color:#999;margin:0;">${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}</p>
          </div>
        `);
        userMarker.addTo(map);
        overlaysRef.current.push(userMarker);
      }

      // Markers with distinct styling per type
      const colors: Record<string, { bg: string; border: string; label: string }> = {
        orbit: { bg: "#36BCCB", border: "#fff", label: "O" },
        user:  { bg: "#F9FF54", border: "#fff", label: "U" },
        event: { bg: "#FF8D23", border: "#fff", label: "E" },
      };

      markers.forEach((m) => {
        const c = colors[m.type] || colors.orbit;
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:36px;height:36px;
            background:${c.bg};
            border:3px solid ${c.border};
            border-radius:50%;
            box-shadow:0 2px 10px rgba(0,0,0,0.35),0 0 12px ${c.bg}40;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;font-weight:800;color:#000;
            transition:transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${c.label}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -22],
        });

        const marker = L.marker([m.lat, m.lng], { icon });
        marker.bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              ${m.image ? `<img src="${m.image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;"/>` : ""}
              <div>
                <span style="font-size:9px;text-transform:uppercase;font-weight:700;color:${c.bg};letter-spacing:0.5px;">${m.type}</span>
                <h3 style="font-weight:700;font-size:14px;margin:2px 0 0;line-height:1.2;">${m.title}</h3>
              </div>
            </div>
            <p style="font-size:12px;color:#888;margin:0 0 10px;">${m.subtitle}</p>
            <a href="${m.href}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#36BCCB;text-decoration:none;font-weight:600;">
              View details →
            </a>
          </div>
        `);
        marker.addTo(map);
        overlaysRef.current.push(marker);
      });
    });
  }, [markers, center, radius, userLocation, ready]);

  return (
    <div className="h-full w-full relative">
      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: rgba(18, 22, 30, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(54, 188, 203, 0.15) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          color: #e5e5e5 !important;
        }
        .leaflet-popup-tip {
          background: rgba(18, 22, 30, 0.95) !important;
          border: 1px solid rgba(54, 188, 203, 0.15) !important;
        }
        .leaflet-popup-close-button {
          color: #888 !important;
        }
        .leaflet-control-zoom a {
          background: rgba(18, 22, 30, 0.9) !important;
          color: #36BCCB !important;
          border-color: rgba(54, 188, 203, 0.2) !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(54, 188, 203, 0.15) !important;
        }
      `}</style>
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
