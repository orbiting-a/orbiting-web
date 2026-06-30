"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Globe, Calendar, GripVertical } from "lucide-react";

const MIN_RANGE = 1;
const MAX_RANGE = 500;

const interests = [
  { label: "Orbits", value: "orbits", icon: Globe },
  { label: "People", value: "people", icon: Users },
  { label: "Events", value: "events", icon: Calendar },
];

const rangeSteps = [10, 50, 100, 200, 500];

function PokeballButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="absolute top-4 left-4 z-[1000]"
      animate={{ scale: isOpen ? 1.15 : 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle radar controls"
    >
      <div
        className="h-14 w-14 rounded-full relative overflow-hidden shadow-xl"
        style={{
          border: "3px solid #1a1a2e",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top half (red) */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{ height: "48%", background: "linear-gradient(180deg, #ef4444, #dc2626)" }}
          animate={isOpen ? { y: -8 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* Bottom half (white) */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{ height: "48%", background: "linear-gradient(0deg, #f8f8f8, #fff)" }}
          animate={isOpen ? { y: 8 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* Center band */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "44%",
            height: "12%",
            background: "linear-gradient(180deg, #2d2d44, #1a1a2e, #2d2d44)",
          }}
        />
        {/* Center button */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #f0f0f0, #c0c0c0 50%, #888 100%)",
            border: "2.5px solid #1a1a2e",
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
          animate={{
            scale: isOpen ? 1.3 : 1,
            boxShadow: isOpen
              ? "0 0 20px rgba(54,188,203,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)"
              : "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <motion.div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #fff, #666 50%, #333 100%)",
              border: "1px solid #555",
            }}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </motion.div>
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(54,188,203,0.3)" }}
          animate={{
            opacity: isOpen ? 1 : 0,
            scale: isOpen ? 1.15 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.button>
  );
}

function RangeSlider({
  radius,
  onChange,
}: {
  radius: number;
  onChange: (r: number) => void;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const trackHeight = 160;

  const fraction = (radius - MIN_RANGE) / (MAX_RANGE - MIN_RANGE);
  const knobY = (1 - fraction) * trackHeight;

  const yToRadius = useCallback(
    (clientY: number) => {
      if (!sliderRef.current) return radius;
      const rect = sliderRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(trackHeight, clientY - rect.top));
      const f = 1 - y / trackHeight;
      return Math.round(MIN_RANGE + f * (MAX_RANGE - MIN_RANGE));
    },
    [radius]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      onChange(yToRadius(e.clientY));
    },
    [onChange, yToRadius]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onChange(yToRadius(e.clientY));
    },
    [isDragging, onChange, yToRadius]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  return (
    <div
      ref={sliderRef}
      className="relative w-10 cursor-pointer shrink-0 touch-none rounded-full border border-border-subtle"
      style={{
        height: trackHeight,
        background: `linear-gradient(to top, #36BCCB22, #36BCCB66, #36BCCB)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-brand-500 shadow-lg flex items-center justify-center pointer-events-none"
        style={{
          top: knobY - 16,
          boxShadow: isDragging
            ? "0 0 0 6px rgba(54,188,203,0.25), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <GripVertical className="h-4 w-4 text-brand-500" />
      </div>
      {rangeSteps.map((km) => {
        const f = (km - MIN_RANGE) / (MAX_RANGE - MIN_RANGE);
        const y = (1 - f) * trackHeight;
        return (
          <div
            key={km}
            className="absolute right-2 flex items-center pointer-events-none"
            style={{ top: y - 4 }}
          >
            <span className="text-[7px] font-medium text-text-muted leading-none">{km}</span>
          </div>
        );
      })}
    </div>
  );
}

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
      <PokeballButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-20 left-4 z-[1000] bg-surface-raised/95 backdrop-blur-md border border-border-subtle rounded-2xl p-4 w-[260px] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="text-xs font-semibold text-text-muted uppercase tracking-wider"
              >
                Radar
              </motion.h3>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                className="text-xs text-brand-400 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full"
              >
                {radius} km
              </motion.span>
            </div>

            <div className="flex gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <RangeSlider radius={radius} onChange={onRadiusChange} />
              </motion.div>

              <motion.div
                className="flex-1 space-y-1.5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {interests.map((interest, i) => {
                  const isActive = activeTypes.includes(interest.value);
                  const Icon = interest.icon;
                  return (
                    <motion.button
                      key={interest.value}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      onClick={() => toggleType(interest.value)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent"
                      )}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon className="h-4 w-4" />
                      {interest.label}
                      {isActive && (
                        <motion.span
                          layoutId="activeDot"
                          className="ml-auto h-2 w-2 rounded-full bg-brand-500"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
