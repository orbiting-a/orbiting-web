"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Globe, Calendar } from "lucide-react";

const MIN_RANGE = 1;
const MEDIAN_RANGE = 1000;
const WORLD_VAL = 20000;

const interests = [
  { label: "Orbits", value: "orbits", icon: Globe },
  { label: "People", value: "people", icon: Users },
  { label: "Events", value: "events", icon: Calendar },
];

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
          border: "3px solid #0f172a",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top half (sky-400 / brand blue) */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{ height: "48%", background: "linear-gradient(180deg, #38bdf8, #0284c7)" }}
          animate={isOpen ? { y: -8 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* Bottom half (dark slate) */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{ height: "48%", background: "linear-gradient(0deg, #1e293b, #0f172a)" }}
          animate={isOpen ? { y: 8 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* Center band */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "44%",
            height: "12%",
            background: "linear-gradient(180deg, #334155, #0f172a, #334155)",
          }}
        />
        {/* Center button */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #f8fafc, #cbd5e1 50%, #64748b 100%)",
            border: "2.5px solid #0f172a",
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
          animate={{
            scale: isOpen ? 1.3 : 1,
            boxShadow: isOpen
              ? "0 0 20px rgba(56,188,248,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)"
              : "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <motion.div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #fff, #94a3b8 50%, #475569 100%)",
              border: "1px solid #64748b",
            }}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </motion.div>
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(56,188,248,0.3)" }}
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

function ArcSlider({
  radius,
  onChange,
}: {
  radius: number;
  onChange: (r: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Constants for SVG
  const cx = 100;
  const cy = 100;
  const r = 80;

  // Calculate theta based on radius
  let theta = 0;
  if (radius >= WORLD_VAL) {
    theta = Math.PI; // Far Left: World
  } else {
    const clampedRadius = Math.max(MIN_RANGE, Math.min(WORLD_VAL - 1, radius));
    if (clampedRadius <= MEDIAN_RANGE) {
      // Right half of arc (0 to PI/2) linearly mapping MIN_RANGE to MEDIAN_RANGE
      theta = ((clampedRadius - MIN_RANGE) / (MEDIAN_RANGE - MIN_RANGE)) * (Math.PI / 2);
    } else {
      // Left half of arc (PI/2 to PI) linearly mapping MEDIAN_RANGE to WORLD_VAL
      theta = Math.PI / 2 + ((clampedRadius - MEDIAN_RANGE) / (WORLD_VAL - MEDIAN_RANGE)) * (Math.PI / 2);
    }
  }

  // Thumb position
  const thumbX = cx + r * Math.cos(theta);
  const thumbY = cy - r * Math.sin(theta);

  const handlePointerUpdate = useCallback(
    (e: React.PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const localX = ((e.clientX - rect.left) / rect.width) * 200;
      const localY = ((e.clientY - rect.top) / rect.height) * 110;

      const dx = localX - cx;
      const dy = cy - localY; // Invert Y so up is positive

      let newTheta = Math.atan2(dy, dx);
      if (newTheta < 0) {
        newTheta = dx < 0 ? Math.PI : 0;
      }

      // Map newTheta to radius
      let newRadius: number;
      if (newTheta > Math.PI - 0.05) {
        newRadius = WORLD_VAL; // World snap
      } else {
        if (newTheta <= Math.PI / 2) {
          // Right half
          newRadius = Math.round(MIN_RANGE + (newTheta / (Math.PI / 2)) * (MEDIAN_RANGE - MIN_RANGE));
        } else {
          // Left half
          newRadius = Math.round(MEDIAN_RANGE + ((newTheta - Math.PI / 2) / (Math.PI / 2)) * (WORLD_VAL - MEDIAN_RANGE));
        }
      }
      onChange(newRadius);
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      handlePointerUpdate(e);
    },
    [handlePointerUpdate]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      handlePointerUpdate(e);
    },
    [isDragging, handlePointerUpdate]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        ref={svgRef}
        viewBox="0 0 200 110"
        className="w-full max-w-[220px] select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" /> {/* Purple for World */}
            <stop offset="50%" stopColor="#38bdf8" /> {/* Sky blue for Mid */}
            <stop offset="100%" stopColor="#10b981" /> {/* Emerald for 1km */}
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track path */}
        <path
          d="M 20,100 A 80,80 0 0,1 180,100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Active track path with gradient */}
        <path
          d="M 20,100 A 80,80 0 0,1 180,100"
          fill="none"
          stroke="url(#arc-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Start / End Labels */}
        <text x="14" y="108" fill="#94a3b8" fontSize="8" fontWeight="800" textAnchor="middle">
          WORLD
        </text>
        <text x="186" y="108" fill="#94a3b8" fontSize="8" fontWeight="800" textAnchor="middle">
          1 KM
        </text>

        {/* Thumb */}
        <circle
          cx={thumbX}
          cy={thumbY}
          r="9"
          fill="#ffffff"
          stroke="#38bdf8"
          strokeWidth="3.5"
          style={{ filter: "url(#glow-filter)", cursor: "grab" }}
        />
      </svg>
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
  const [inputValue, setInputValue] = useState("");

  // Update input text when external radius changes
  useEffect(() => {
    if (radius >= WORLD_VAL) {
      setInputValue("World");
    } else {
      setInputValue(radius.toString());
    }
  }, [radius]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed === "world" || trimmed === "") {
      onRadiusChange(WORLD_VAL);
      setInputValue("World");
    } else {
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || num <= 0) {
        onRadiusChange(WORLD_VAL);
        setInputValue("World");
      } else {
        // Enforce limits: minimum 1km, maximum 20000km (World)
        const clamped = Math.max(MIN_RANGE, Math.min(WORLD_VAL, num));
        onRadiusChange(clamped);
        setInputValue(clamped >= WORLD_VAL ? "World" : clamped.toString());
      }
    }
  };

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
            className="absolute top-20 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 w-[280px] shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(56,188,248,0.15)]"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Discovery Radar
              </h3>
              <span className="text-[10px] text-sky-400 font-extrabold bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {radius >= WORLD_VAL ? "World" : `${radius} km`}
              </span>
            </div>

            <div className="space-y-4">
              {/* Semicircle Slider Control Container */}
              <div className="flex flex-col items-center justify-center py-3 bg-slate-950/40 rounded-xl border border-slate-800/80 px-2">
                <ArcSlider radius={radius} onChange={onRadiusChange} />

                {/* Custom input box */}
                <div className="mt-4 flex items-center justify-between gap-2 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus-within:border-sky-500/50 transition-colors">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Custom Radius
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="w-16 bg-transparent text-right text-xs font-bold text-sky-400 focus:outline-none focus:ring-0 p-0"
                      placeholder="World"
                    />
                    <span className="text-[9px] text-slate-600 font-bold">
                      {radius >= WORLD_VAL ? "" : "KM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of interest filters */}
              <div className="grid grid-cols-3 gap-1.5">
                {interests.map((interest) => {
                  const isActive = activeTypes.includes(interest.value);
                  const Icon = interest.icon;
                  return (
                    <button
                      key={interest.value}
                      onClick={() => toggleType(interest.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 justify-center py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-200",
                        isActive
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,188,248,0.15)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent bg-slate-900/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {interest.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
