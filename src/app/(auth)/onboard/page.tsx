"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

const slides = [
  {
    id: 1,
    title: "Discover Nearby Communities",
    desc: "Find orbits and events right in your college campus or local neighborhood.",
    color: "#FF8D23", // const Color(0xFFFF8D23)
    icon: "🛰️",
  },
  {
    id: 2,
    title: "Attend Events And Earn Rewards",
    desc: "RSVP to local meetups, complete quests, and unlock collectibles.",
    color: "#20F4FF", // const Color(0xFF20F4FF)
    icon: "📡",
  },
  {
    id: 3,
    title: "Connect Quests & Challenges",
    desc: "Join real-time treasure hunts, answer polls, and complete tasks.",
    color: "#9570FE", // const Color(0xFF9570FE)
    icon: "🏆",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between py-12 px-6 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        {/* Card Stack with Framer Motion */}
        <div className="relative w-full h-[400px] mb-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-[360px] rounded-3xl bg-[#170F27] border border-[#2e303d] p-8 flex flex-col justify-between shadow-2xl overflow-hidden"
            >
              {/* Colored Glow/Backdrop */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500"
                style={{ backgroundColor: slides[current].color }}
              />

              {/* Slide Icon */}
              <div className="flex justify-between items-start">
                <span className="text-6xl">{slides[current].icon}</span>
                <span className="text-xs text-[#a5a1ac] font-mono">0{slides[current].id} / 03</span>
              </div>

              {/* Title & Desc */}
              <div className="mt-8">
                <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {slides[current].title}
                </h2>
                <p className="text-sm text-[#a5a1ac] mt-3 leading-relaxed">
                  {slides[current].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: current === i ? "24px" : "6px",
                backgroundColor: current === i ? "#36BCCB" : "#2e303d",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Explore Button */}
      <div className="w-full max-w-sm">
        <Button
          onClick={() => router.push("/founder")}
          variant="primary"
          size="lg"
          className="w-full font-bold bg-[#36BCCB] text-black hover:bg-[#2da8b6] rounded-xl shadow-lg shadow-brand-400/20"
        >
          Explore SOLOCO
        </Button>
      </div>
    </div>
  );
}
