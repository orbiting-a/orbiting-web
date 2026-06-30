"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, MessageCircle, Radio, Plus, X, Wallet, Compass, Sparkles, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const items = [
    { href: "/radar", label: "Radar", icon: Radio },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "satellite", label: "Chakra", icon: Sparkles, isCenter: true },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/feed", label: "Home", icon: Home },
  ];

  const radialActions = [
    { label: "Create Post", icon: Plus, action: () => { setIsOpen(false); router.push("/create-orbit"); } },
    { label: "New Orbit", icon: Compass, action: () => { setIsOpen(false); router.push("/create-orbit"); } },
    { label: "New Activity", icon: Sparkles, action: () => { setIsOpen(false); router.push("/create-activity"); } },
    { label: "My Wallet", icon: Wallet, action: () => { setIsOpen(false); router.push("/wallet"); } },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {items.map((item) => {
            const isActive =
              !item.isCenter &&
              (pathname === item.href || pathname.startsWith(item.href + "/"));

            if (item.isCenter) {
              return (
                <button
                  key={item.href}
                  onClick={toggleMenu}
                  className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-[#36BCCB] to-[#2da8b6] text-black shadow-lg shadow-brand-400/25 active:scale-95 transition-transform z-50 cursor-pointer relative -top-3 border-4 border-black"
                  aria-label="Open Chakra menu"
                >
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="satellite"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        {/* Custom Satellite-like icon */}
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-black" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 16.5l2-2M16.5 7.5l2-2" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all",
                  isActive ? "text-[#36BCCB]" : "text-text-secondary hover:text-text-primary"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Radial/Chakra Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex items-end justify-center pb-24">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Radial Menu Items */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-50 bg-[#20222f] border border-[#2e303d] rounded-3xl p-6 w-[280px] flex flex-col gap-3 shadow-2xl"
            >
              <h3 className="text-center font-bold text-sm text-[#36BCCB] tracking-wider uppercase mb-2 flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Orbiting Chakra
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {radialActions.map((action, idx) => (
                  <motion.button
                    key={action.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.action}
                    className="p-4 rounded-2xl bg-[#161720] border border-[#2e303d] hover:border-[#36BCCB]/30 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#36BCCB]/10 flex items-center justify-center text-[#36BCCB]">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-white">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
