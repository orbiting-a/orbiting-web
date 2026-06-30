"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const interestOptions = [
  { id: "tech", label: "Technology", icon: "💻" },
  { id: "music", label: "Music & Concerts", icon: "🎵" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "sports", label: "Sports & Fitness", icon: "⚽" },
  { id: "art", label: "Art & Design", icon: "🎨" },
  { id: "movies", label: "Movies & Shows", icon: "🍿" },
  { id: "books", label: "Books & Writing", icon: "📚" },
  { id: "food", label: "Food & Cooking", icon: "🍳" },
  { id: "travel", label: "Travel & Outdoor", icon: "✈️" },
  { id: "fashion", label: "Fashion & Style", icon: "👔" },
  { id: "startup", label: "Startups & Biz", icon: "🚀" },
  { id: "crypto", label: "Web3 & Crypto", icon: "🪙" },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-[#9570FE] font-bold">Step 2 of 3</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Select your Interests</h1>
          <p className="text-sm text-[#a5a1ac] mt-2">
            We use these to suggest orbits and events tailored for you.
          </p>
        </div>

        {/* Interests Grid */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          {interestOptions.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleInterest(item.id)}
                className={`p-4 rounded-2xl flex flex-col items-start justify-between text-left border transition-all duration-200 cursor-pointer h-28 relative ${
                  isSelected
                    ? "bg-[#20222f] border-[#36BCCB] shadow-md shadow-[#36BCCB]/10"
                    : "bg-[#161720] border-[#2e303d] hover:border-[#36BCCB]/30"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-bold text-white mt-2">{item.label}</span>

                {isSelected && (
                  <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#36BCCB] flex items-center justify-center text-black">
                    <Check className="h-3 w-3 stroke-[3px]" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (matching Flutter app's FAB with ArrowRight) */}
      <div className="max-w-md w-full mx-auto flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/permission")}
          className="h-14 w-14 rounded-full bg-[#F9FF54] text-black flex items-center justify-center shadow-lg shadow-[#F9FF54]/20 hover:bg-[#e8ed3e] transition-colors cursor-pointer"
          aria-label="Next step"
        >
          <ArrowRight className="h-6 w-6 stroke-[2.5px]" />
        </motion.button>
      </div>
    </div>
  );
}
