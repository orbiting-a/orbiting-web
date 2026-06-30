"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Users, Globe, Calendar, Map, Crosshair, GripVertical } from "lucide-react";

const MIN_RANGE = 1;
const MAX_RANGE = 500;

const interests = [
  { label: "Orbits", value: "orbits", icon: Globe },
  { label: "People", value: "people", icon: Users },
  { label: "Events", value: "events", icon: Calendar },
];

export function ChakraFilter({
  radius,
  onRadiusChange,
  activeTypes,
  onTypesChange,
}: {
  radius: number;
  onRadiusChange: (r: number) => void;
  activeTypes: string[];
  onTypesChange: (types: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fraction = (radius - MIN_RANGE) / (MAX_RANGE - MIN_RANGE);

  const radiusToY = useCallback((r: number) => {
    return (1 - (r - MIN_RANGE) / (MAX_RANGE - MIN_RANGE)) * 140;
  }, []);

  const yToRadius = useCallback((y: number) => {
    const clamped = Math.max(0, Math.min(140, y));
    const f = 1 - clamped / 140;
    return Math.round(MIN_RANGE + f * (MAX_RANGE - MIN_RANGE));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    onRadiusChange(yToRadius(y));
  }, [onRadiusChange, yToRadius]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    onRadiusChange(yToRadius(y));
  }, [isDragging, onRadiusChange, yToRadius]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleType = (type: string) => {
    if (activeTypes.includes(type)) {
      onTypesChange(activeTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...activeTypes, type]);
    }
  };

  const knobY = radiusToY(radius);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute top-4 left-4 z-[1000] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
          isOpen ? "scale-110" : ""
        )}
        aria-label="Toggle radar controls"
        style={{
          background: "linear-gradient(180deg, #ef4444 0%, #ef4444 48%, #333 48%, #333 52%, #fff 52%, #fff 100%)",
          border: "3px solid #222",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #fff, #ddd 50%, #999 100%)",
            border: "2px solid #555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #fff, #666 50%, #333 100%)",
              border: "1px solid #555",
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute top-20 left-4 z-[1000] bg-surface-raised/95 backdrop-blur-md border border-border-subtle rounded-2xl p-4 w-[260px] shadow-2xl space-y-4"
          onPointerUp={handlePointerUp}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Radar
            </h3>
            <span className="text-xs text-brand-400 font-medium">{radius} km</span>
          </div>

          <div className="flex gap-4">
            <div
              ref={sliderRef}
              className="relative w-10 h-[140px] bg-surface-raised rounded-full border border-border-subtle cursor-pointer shrink-0 touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              style={{ background: "linear-gradient(to top, #36BCCB33, #36BCCB88, #36BCCB)" }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-brand-500 shadow-lg flex items-center justify-center pointer-events-none transition-shadow"
                style={{
                  top: knobY - 16,
                  boxShadow: isDragging ? "0 0 0 6px rgba(54,188,203,0.25)" : "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                <GripVertical className="h-4 w-4 text-brand-500" />
              </div>
              {[100, 50, 10].map((km) => {
                const y = radiusToY(km);
                return (
                  <div
                    key={km}
                    className="absolute right-2 pointer-events-none"
                    style={{ top: y - 6 }}
                  >
                    <span className="text-[8px] text-text-muted">{km}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex-1 space-y-1.5">
              {interests.map((interest) => {
                const isActive = activeTypes.includes(interest.value);
                const Icon = interest.icon;
                return (
                  <button
                    key={interest.value}
                    onClick={() => toggleType(interest.value)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {interest.label}
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
