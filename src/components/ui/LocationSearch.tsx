"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

export interface LocationResult {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  country: string;
}

interface LocationSearchProps {
  value?: LocationResult | null;
  onChange: (loc: LocationResult | null) => void;
  placeholder?: string;
}

export function LocationSearch({ value, onChange, placeholder = "Search for a place..." }: LocationSearchProps) {
  const [query, setQuery] = useState(value?.displayName || "");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query || query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await res.json();
        setResults(
          data.map((item: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; country?: string } }) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name,
            city: item.address?.city || item.address?.town || item.address?.village || "",
            country: item.address?.country || "",
          }))
        );
        setOpen(true);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (loc: LocationResult) => {
    setQuery(loc.displayName);
    onChange(loc);
    setOpen(false);
  };

  const clear = () => {
    setQuery("");
    onChange(null);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-9 pr-8 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          ) : value ? (
            <button type="button" onClick={clear} className="text-text-muted hover:text-text-primary text-xs">✕</button>
          ) : null}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-surface-raised border border-border-subtle shadow-xl max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => select(r)}
              className="w-full text-left px-3 py-2.5 text-sm text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 flex items-start gap-2 border-b border-border-subtle last:border-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-400" />
              <span className="line-clamp-2">{r.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-brand-400">
          <MapPin className="h-3 w-3" />
          <span>
            {value.city}{value.city && value.country ? ", " : ""}{value.country || `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
          </span>
        </div>
      )}
    </div>
  );
}
