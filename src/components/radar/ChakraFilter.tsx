"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, Globe, Calendar, Activity, Radio } from "lucide-react";

const distances = [
  { label: "25 km", value: 25 },
  { label: "100 km", value: 100 },
  { label: "200 km", value: 200 },
  { label: "500 km", value: 500 },
  { label: "World", value: 20000 },
];

const interests = [
  { label: "Orbits", value: "orbits", icon: Globe },
  { label: "People", value: "people", icon: Users },
  { label: "Events", value: "events", icon: Calendar },
  { label: "Activities", value: "activities", icon: Activity },
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

  const toggleType = (type: string) => {
    if (activeTypes.includes(type)) {
      onTypesChange(activeTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...activeTypes, type]);
    }
  };

  return (
    <>
      {/* Floating Chakra Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-[1000] h-12 w-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-400/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Toggle filters"
      >
        <Radio className="h-5 w-5" />
      </button>

      {/* Chakra Panel */}
      {isOpen && (
        <div className="absolute top-20 left-4 z-[1000] bg-surface-raised/95 backdrop-blur-md border border-border-subtle rounded-2xl p-4 w-[240px] shadow-2xl space-y-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Radar Filters
          </h3>

          {/* Distance */}
          <div>
            <label className="text-xs text-text-secondary mb-2 block">
              Distance
            </label>
            <div className="flex flex-wrap gap-1.5">
              {distances.map((d) => (
                <button
                  key={d.value}
                  onClick={() => onRadiusChange(d.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    radius === d.value
                      ? "bg-brand-500 text-white"
                      : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Types */}
          <div>
            <label className="text-xs text-text-secondary mb-2 block">
              Show
            </label>
            <div className="space-y-1.5">
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
