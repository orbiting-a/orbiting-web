"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface MapPickerResult {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  country: string;
}

export function MapPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: MapPickerResult) => void;
  initialLocation?: { lat: number; lng: number } | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [28.6139, 77.209]
  );
  const [address, setAddress] = useState<string>("Loading location address...");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [locationDetails, setLocationDetails] = useState<{ city: string; country: string }>({ city: "", country: "" });

  // Reverse geocode to get address details
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      if (data) {
        setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setLocationDetails({
          city: data.address?.city || data.address?.town || data.address?.village || "",
          country: data.address?.country || "",
        });
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoadingAddress(false);
    }
  };

  // Trigger geocode on position change
  useEffect(() => {
    if (isOpen) {
      reverseGeocode(position[0], position[1]);
    }
  }, [position[0], position[1], isOpen]);

  // Init map
  useEffect(() => {
    if (!isOpen || mapInstance.current) return;
    let map: any = null;

    async function init() {
      const L = await import("leaflet");
      if (!mapRef.current) return;

      const m = L.map(mapRef.current, {
        center: position,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(m);

      const markerIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(54,188,203,0.2);animation:pulse-ring 2s infinite"/>
          <div style="width:12px;height:12px;border-radius:50%;background:#36BCCB;border:2.5px solid white;box-shadow:0 0 8px rgba(54,188,203,0.6)"/>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(position, { icon: markerIcon, draggable: true });
      marker.addTo(m);

      marker.on("dragend", (e: any) => {
        const latLng = e.target.getLatLng();
        setPosition([latLng.lat, latLng.lng]);
      });

      m.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPosition([lat, lng]);
      });

      mapInstance.current = m;
      markerInstance.current = marker;
      map = m;
      setMapReady(true);
    }

    init();

    return () => {
      if (map) map.remove();
      mapInstance.current = null;
      markerInstance.current = null;
      setMapReady(false);
    };
  }, [isOpen]);

  // Update map marker when position changes externally (like from search)
  useEffect(() => {
    if (mapReady && mapInstance.current && markerInstance.current) {
      mapInstance.current.setView(position, mapInstance.current.getZoom());
      markerInstance.current.setLatLng(position);
    }
  }, [position[0], position[1], mapReady]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      lat: position[0],
      lng: position[1],
      displayName: address,
      city: locationDetails.city,
      country: locationDetails.country,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h3 className="font-bold text-text-primary">Choose Location</h3>
            <p className="text-xs text-text-muted mt-0.5">Search or drop a pin on the map</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-subtle bg-background/50 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, neighborhood, or building..."
                className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-9 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {searching && <Loader2 className="h-4 w-4 animate-spin" />}
              Search
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-border-subtle bg-surface-raised rounded-xl overflow-hidden shadow-lg max-h-36 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const lat = parseFloat(r.lat);
                    const lon = parseFloat(r.lon);
                    setPosition([lat, lon]);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 dark:hover:bg-brand-900/20 text-text-primary border-b border-border-subtle last:border-0 truncate"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[300px]">
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          <style>{`
            @keyframes pulse-ring {
              0% { transform: scale(0.5); opacity: 0.6; }
              100% { transform: scale(1.8); opacity: 0; }
            }
          `}</style>
          
          {/* Geocoded Address Panel */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-surface-raised/95 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-lg flex items-start gap-2.5">
            <MapPin className="h-4 w-4 mt-0.5 text-brand-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">Selected Address</span>
              <p className="text-xs text-text-primary truncate mt-0.5">
                {loadingAddress ? "Reverse geocoding..." : address}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-subtle shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loadingAddress}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
