"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

export default function FounderNotePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between py-12 px-6">
      <div className="max-w-md mx-auto flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#20222f] border border-[#2e303d] rounded-3xl p-6 overflow-hidden shadow-2xl"
        >
          {/* Decorative frame elements */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-400" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-400" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-400" />

          {/* Heading */}
          <h1 className="text-xl font-bold text-brand-400 mb-4 flex items-center gap-2">
            🛰️ Founder&apos;s Note
          </h1>

          {/* Content */}
          <div className="space-y-4 text-sm text-[#a5a1ac] leading-relaxed">
            <p>
              Welcome to <strong>Orbiting</strong> (also known as <em>Soloco</em>)! We built this platform because social networks shouldn&apos;t feel like distant broadcast feeds.
            </p>
            <p>
              We wanted to bring social interactions back to the physical communities that shape our everyday life — campuses, clubs, and neighborhoods.
            </p>
            <p>
              Through real-time local feeds, collaborative quests, chat rooms, and challenges, we hope to make discovery feel natural, exciting, and rewarding.
            </p>
            <p className="font-semibold text-white">
              Thanks for orbiting with us,
              <br />
              <span className="text-brand-400">— The Team</span>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-md w-full mx-auto mt-6">
        <Button
          onClick={() => router.push("/interests")}
          variant="primary"
          size="lg"
          className="w-full font-bold bg-[#36BCCB] text-black hover:bg-[#2da8b6] rounded-xl"
        >
          Alright
        </Button>
      </div>
    </div>
  );
}
