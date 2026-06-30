"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { MapPin, Navigation } from "lucide-react";

export default function PermissionPage() {
  const router = useRouter();

  const handleRequestLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success
          router.push("/feed");
        },
        (error) => {
          // Denied or error
          router.push("/feed");
        }
      );
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center text-center">
        {/* Animated Satellite Radar Icon */}
        <div className="relative h-40 w-40 mb-8 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border-2 border-[#36BCCB]"
          />
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.8 }}
            className="absolute inset-0 rounded-full border border-[#36BCCB]"
          />
          <div className="h-20 w-20 rounded-full bg-[#20222f] border border-[#2e303d] flex items-center justify-center shadow-lg shadow-[#36BCCB]/10 relative z-10">
            <MapPin className="h-10 w-10 text-[#36BCCB]" />
          </div>
        </div>

        <span className="text-xs uppercase tracking-widest text-[#9570FE] font-bold mb-2">Step 3 of 3</span>
        <h1 className="text-2xl font-bold max-w-xs">
          Enable Location
        </h1>
        <p className="text-sm text-[#a5a1ac] mt-3 leading-relaxed max-w-sm">
          We need your location so you can discover Orbits and events happening around you, and play localized treasure hunts.
        </p>
      </div>

      <div className="max-w-md w-full mx-auto flex items-center gap-4">
        <Button
          onClick={() => router.push("/feed")}
          variant="ghost"
          size="lg"
          className="flex-1 text-[#a5a1ac]"
        >
          No, thanks
        </Button>
        <Button
          onClick={handleRequestLocation}
          variant="primary"
          size="lg"
          className="flex-1 font-bold bg-[#36BCCB] text-black hover:bg-[#2da8b6]"
          icon={<Navigation className="h-4 w-4" />}
        >
          Allow access
        </Button>
      </div>
    </div>
  );
}
