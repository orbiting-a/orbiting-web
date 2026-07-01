"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui";
import { 
  Navigation, 
  MapPin, 
  Compass, 
  MessageSquare, 
  Award, 
  Flame, 
  Users, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Shield,
  Coins
} from "lucide-react";

// Mock Orbits for Radar Scan
const MOCK_RADAR_NODES = [
  { id: 1, name: "Tech Innovators", category: "Tech", distance: "250m", members: 142, x: 35, y: 40, active: true },
  { id: 2, name: "Gaming Hub", category: "Gaming", distance: "400m", members: 89, x: 65, y: 25, active: true },
  { id: 3, name: "Music Jam Orbit", category: "Music", distance: "600m", members: 210, x: 20, y: 70, active: false },
  { id: 4, name: "Crypto Guild", category: "Web3", distance: "800m", members: 76, x: 75, y: 65, active: true },
  { id: 5, name: "IRL Runners", category: "Fitness", distance: "1.2km", members: 54, x: 45, y: 80, active: false },
];

const CARD_STACK_ITEMS = [
  {
    id: 1,
    title: "Vibrant Orbits",
    tag: "Communities",
    description: "Launch public or private orbits for your college, neighborhood, club, or circle. Share posts, schedule activities, and hold live chats.",
    color: "from-teal-400 to-[#36BCCB]",
    icon: Users
  },
  {
    id: 2,
    title: "Live Radar Discoverability",
    tag: "IRL Connections",
    description: "Locate active groups and meetup coordinates dynamically in real-time. Scan your local environment and join instant nearby hubs.",
    color: "from-purple-400 to-indigo-500",
    icon: Compass
  },
  {
    id: 3,
    title: "Play Local Quests",
    tag: "Gamification",
    description: "Participate in geo-location treasure hunts, riddle solves, and interactive local check-in challenges hosted by community leaders.",
    color: "from-yellow-400 to-[#F9FF54]",
    icon: Flame
  },
  {
    id: 4,
    title: "Earn Digital Collectibles",
    tag: "Web3 Wallet",
    description: "Unlock customized proof-of-activity NFT badges and claim SOLO tokens for supporting and participating in local events.",
    color: "from-pink-400 to-red-500",
    icon: Award
  }
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const [selectedNode, setSelectedNode] = useState<typeof MOCK_RADAR_NODES[0] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cardStack, setCardStack] = useState(CARD_STACK_ITEMS);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  // Mouse move position for cursor glowing cards
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Web Audio Sonar Ping Synthesis
  const playPingSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  const startRadarScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    playPingSound();
    
    // Auto-ping sound interval during scan
    const pingInterval = setInterval(playPingSound, 1200);

    setTimeout(() => {
      setIsScanning(false);
      clearInterval(pingInterval);
      // Select a random node after scan
      const randNode = MOCK_RADAR_NODES[MOCK_RADAR_NODES.findIndex(n => n.id === selectedNode?.id) + 1] || MOCK_RADAR_NODES[0];
      setSelectedNode(randNode);
    }, 3600);
  };

  const handleSwipeCard = () => {
    setCardStack((prev) => {
      const copy = [...prev];
      const first = copy.shift();
      if (first) copy.push(first);
      return copy;
    });
  };

  return (
    <div ref={heroRef} className="min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-[#36BCCB]/30 selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#36BCCB] z-50 origin-left" style={{ scaleX }} />

      {/* Futuristic Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161922_1px,transparent_1px),linear-gradient(to_bottom,#161922_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-45" />
      
      {/* Radial ambient glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#36BCCB]/10 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#F9FF54]/5 rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[600px] h-[600px] bg-purple-500/5 rounded-full filter blur-[140px] pointer-events-none" />

      {/* Floating Interactive Cursor Glow (10k Glassmorphism Effect) */}
      <div 
        className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(54,188,203,0.06)_0%,transparent_70%)] rounded-full pointer-events-none blur-2xl transition-transform duration-100 hidden md:block" 
        style={{
          transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)`,
        }}
      />

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/[0.08] bg-black/40 px-6 py-4 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Orbiting" width={36} height={36} className="rounded-full" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-[#a5a1ac] bg-clip-text text-transparent">Orbiting</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a5a1ac]">
            <a href="#features" className="hover:text-white transition-colors relative group">
              <span>Features</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-0.5 bg-[#36BCCB] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#radar-demo" className="hover:text-white transition-colors relative group">
              <span>Radar Scan</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-0.5 bg-[#36BCCB] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#rewards" className="hover:text-white transition-colors relative group">
              <span>Rewards</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-0.5 bg-[#36BCCB] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#faq" className="hover:text-white transition-colors relative group">
              <span>FAQ</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-0.5 bg-[#36BCCB] group-hover:w-full transition-all duration-300" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-[#a5a1ac] hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="relative group px-5 py-2.5 text-sm font-bold bg-[#36BCCB] text-black rounded-xl hover:bg-[#F9FF54] transition-all duration-300 shadow-lg shadow-[#36BCCB]/10 hover:shadow-[#F9FF54]/25 overflow-hidden">
              <span className="relative z-10 flex items-center gap-1.5">
                Get Started <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left copy */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-[#36BCCB] text-xs font-semibold shadow-inner"
          >
            <Sparkles className="h-3 w-3 animate-pulse text-[#F9FF54]" />
            <span>Discover Local Community Networks</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
          >
            Communities That
            <br />
            <span className="bg-gradient-to-r from-[#36BCCB] via-[#36BCCB] to-[#F9FF54] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(54,188,203,0.2)]">
              Move With You
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-[#a5a1ac] max-w-xl leading-relaxed"
          >
            Vibrant, geolocation-mapped communities built around your location, your hobbies, and your real connections. Scan the radar, complete rewards, and find your orbit.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-[#36BCCB] text-black rounded-xl hover:bg-[#F9FF54] transition-all shadow-xl shadow-[#36BCCB]/15 hover:shadow-[#F9FF54]/25 flex items-center justify-center gap-2">
              Launch App <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#radar-demo" className="w-full sm:w-auto px-8 py-4 text-base font-semibold border border-white/10 rounded-xl hover:border-[#36BCCB]/40 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] transition-all text-center">
              Try Live Scan
            </a>
          </motion.div>
        </div>

        {/* Right Interactive 3D Model Showcase */}
        <div className="lg:col-span-5 flex justify-center relative">
          <div className="absolute inset-0 bg-[#36BCCB]/5 rounded-full filter blur-3xl animate-pulse" />
          
          {/* Outer Rotating Rings simulating 3D Planet System */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-white/[0.06] flex items-center justify-center bg-white/[0.01] backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
            <div className="absolute inset-4 rounded-full border border-dashed border-white/[0.08] animate-spin" style={{ animationDuration: "60s" }} />
            <div className="absolute inset-16 rounded-full border border-white/[0.08] animate-spin" style={{ animationDuration: "30s", animationDirection: "reverse" }} />
            
            {/* Pulsing Core satellite model */}
            <div className="w-40 h-40 rounded-full bg-[#20222f]/60 backdrop-blur-xl border border-white/15 flex items-center justify-center relative shadow-2xl shadow-[#36BCCB]/10 z-10">
              <Image src="/logo.png" alt="Orbiting" width={80} height={80} className="rounded-full" />
              <div className="absolute inset-0 rounded-full border-2 border-[#36BCCB] animate-ping opacity-20" style={{ animationDuration: "3s" }} />
            </div>

            {/* Orbiting Interactive nodes */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Tech Node */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 pointer-events-auto cursor-pointer hover:border-[#36BCCB] hover:shadow-[0_0_15px_rgba(54,188,203,0.3)] transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span className="text-xs font-bold">Tech Orbit</span>
              </div>

              {/* Music Node */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 pointer-events-auto cursor-pointer hover:border-[#36BCCB] hover:shadow-[0_0_15px_rgba(54,188,203,0.3)] transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F9FF54]" />
                <span className="text-xs font-bold">Music</span>
              </div>
            </motion.div>

            {/* Orbiting Ring 2 */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Gaming Node */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 pointer-events-auto cursor-pointer hover:border-brand-400 hover:shadow-[0_0_15px_rgba(54,188,203,0.3)] transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-xs font-bold">Gaming</span>
              </div>

              {/* Web3 Node */}
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 pointer-events-auto cursor-pointer hover:border-brand-400 hover:shadow-[0_0_15px_rgba(54,188,203,0.3)] transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-xs font-bold">Web3</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE RADAR SCAN DEMO ================= */}
      <section id="radar-demo" className="py-24 border-t border-white/[0.06] bg-gradient-to-b from-[#20222f]/20 via-black to-black relative">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Interactive Radar System</h2>
          <p className="text-[#a5a1ac] max-w-xl mx-auto mb-12">
            Try a simulated scan of your local area. See active community orbits, check details, and join the network.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: The Radar Scan Visualizer */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full bg-white/[0.01] border-4 border-white/[0.06] relative overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-sm">
                
                {/* Sonar sweep background circles */}
                <div className="absolute inset-6 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-16 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-28 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-40 rounded-full border border-white/[0.06]" />
                
                {/* Horizontal & Vertical Crosshairs */}
                <div className="absolute inset-x-0 h-px bg-white/[0.06]" />
                <div className="absolute inset-y-0 w-px bg-white/[0.06]" />

                {/* Sweeping Scanner line */}
                {isScanning && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    className="absolute w-1/2 h-1/2 origin-bottom-right bottom-1/2 right-1/2 bg-gradient-to-tr from-[#36BCCB]/25 to-transparent pointer-events-none rounded-tl-full"
                  />
                )}

                {/* Nodes that populate when scanning or after scan */}
                {MOCK_RADAR_NODES.map((node) => {
                  const isVisible = !isScanning || selectedNode?.id === node.id;
                  return (
                    <motion.button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`absolute h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all ${
                        selectedNode?.id === node.id 
                          ? "bg-[#F9FF54] ring-4 ring-[#F9FF54]/30 scale-125 z-30 shadow-[0_0_15px_#F9FF54]" 
                          : "bg-[#36BCCB] ring-4 ring-[#36BCCB]/10 hover:scale-110 shadow-[0_0_10px_rgba(54,188,203,0.5)]"
                      }`}
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        opacity: isVisible ? 1 : 0.2
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: isVisible ? 1 : 0.6 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      <span className="absolute w-2 h-2 bg-black rounded-full" />
                    </motion.button>
                  );
                })}

                {/* Radar Scanning State overlay */}
                {isScanning && (
                  <div className="absolute bottom-6 bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#36BCCB]/30 text-[#36BCCB] text-xs font-bold tracking-widest uppercase animate-pulse">
                    Scanning Area...
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Node Details Panel (Glassmorphic) */}
            <div className="lg:col-span-5 flex flex-col justify-center text-left">
              <div className="bg-[#20222f]/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[320px] flex flex-col justify-between shadow-[#36BCCB]/5">
                
                <AnimatePresence mode="wait">
                  {selectedNode ? (
                    <motion.div
                      key={selectedNode.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-3 py-1 rounded-full bg-[#36BCCB]/10 border border-[#36BCCB]/25 text-[#36BCCB] text-xs font-semibold uppercase tracking-wider">
                            {selectedNode.category}
                          </span>
                          <h3 className="text-2xl font-bold mt-3 text-white">{selectedNode.name}</h3>
                        </div>
                        <MapPin className="h-6 w-6 text-[#36BCCB] drop-shadow-[0_0_8px_#36BCCB]" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-b border-white/[0.06] py-5">
                        <div>
                          <p className="text-xs text-[#a5a1ac] uppercase tracking-wider font-semibold">Distance</p>
                          <p className="text-lg font-bold text-white mt-1">{selectedNode.distance}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#a5a1ac] uppercase tracking-wider font-semibold">Active Members</p>
                          <p className="text-lg font-bold text-[#F9FF54] mt-1">{selectedNode.members} members</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-teal-600 border-2 border-[#20222f]" />
                          <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#20222f]" />
                          <div className="w-8 h-8 rounded-full bg-pink-600 border-2 border-[#20222f]" />
                        </div>
                        <span className="text-xs text-[#a5a1ac] font-medium">Joined by people from your neighborhood</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
                      <Compass className="h-12 w-12 text-[#a5a1ac]/40 animate-spin" style={{ animationDuration: "16s" }} />
                      <p className="text-[#a5a1ac] text-sm leading-relaxed px-4">
                        Click the scanner button or tap any coordinates on the map grid to preview community stats.
                      </p>
                    </div>
                  )}
                </AnimatePresence>

                <div className="mt-8 pt-4 border-t border-white/[0.06]">
                  <Button
                    onClick={startRadarScan}
                    disabled={isScanning}
                    variant="primary"
                    className="w-full font-bold bg-[#36BCCB] text-black hover:bg-[#F9FF54] transition-colors py-3.5 shadow-lg shadow-[#36BCCB]/10 hover:shadow-[#F9FF54]/20"
                  >
                    {isScanning ? "Scanning Local Node Grid..." : "Scan Near Me"}
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= DRAG-TO-EXPLORE FEATURE CARD STACK ================= */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6 relative">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">Explore Core Mechanics</h2>
        <p className="text-[#a5a1ac] text-center max-w-xl mx-auto mb-16">
          Orbiting integrates social communities with geolocation mechanics and gaming rewards. Tap to swipe the card deck below.
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          {/* Animated Glassmorphic Card Stack */}
          <div className="relative w-72 h-96 sm:w-80 cursor-pointer" onClick={handleSwipeCard}>
            {cardStack.map((card, idx) => {
              const rotate = idx * 4;
              const translateY = idx * -12;
              const scale = 1 - idx * 0.05;
              const isTop = idx === 0;

              return (
                <motion.div
                  key={card.id}
                  style={{
                    transformOrigin: "bottom center",
                  }}
                  animate={{
                    rotate: isTop ? 0 : rotate,
                    y: isTop ? 0 : translateY,
                    scale: isTop ? 1 : scale,
                    zIndex: CARD_STACK_ITEMS.length - idx,
                  }}
                  whileHover={isTop ? { scale: 1.03, rotate: -1 } : {}}
                  transition={{ type: "spring", stiffness: 150, damping: 18 }}
                  className={`absolute inset-0 p-6 rounded-3xl border border-white/[0.08] bg-[#20222f]/50 backdrop-blur-xl shadow-2xl flex flex-col justify-between overflow-hidden ${
                    isTop ? "border-[#36BCCB]/30" : "opacity-60"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-wider text-[#36BCCB] font-bold">{card.tag}</span>
                      <card.icon className="h-6 w-6 text-[#36BCCB]" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-[#a5a1ac] leading-relaxed">{card.description}</p>
                  </div>

                  {isTop && (
                    <div className="flex items-center justify-between text-xs text-[#a5a1ac] border-t border-white/[0.06] pt-4 mt-auto">
                      <span>Click to Swipe</span>
                      <ChevronRight className="h-4 w-4 text-[#36BCCB] animate-bounce" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Core Feature Bullet Column (Glassmorphic) */}
          <div className="space-y-6 max-w-lg text-left">
            {[
              {
                icon: MapPin,
                title: "Local Discoverability Map",
                desc: "Filter nearby orbits by distance (from 100m to 10km) or specific categories."
              },
              {
                icon: MessageSquare,
                title: "Rich Chat Rooms",
                desc: "Structured chat channels, text posts, video highlights, and member boards."
              },
              {
                icon: Flame,
                title: "Gamified Local Quests",
                desc: "Check-in at physical checkpoints to solve riddle routes and unlock prizes."
              },
              {
                icon: Award,
                title: "Web3 Digital Collectibles",
                desc: "Prove local status and earn badges backed by secure blockchain protocols."
              }
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl bg-[#20222f]/30 backdrop-blur-md border border-white/[0.06] hover:border-[#36BCCB]/25 hover:shadow-[0_0_15px_rgba(54,188,203,0.05)] transition-all duration-350">
                <div className="h-10 w-10 rounded-xl bg-[#36BCCB]/10 border border-[#36BCCB]/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-[#36BCCB]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">{f.title}</h4>
                  <p className="text-xs text-[#a5a1ac] mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= GAMIFIED REWARDS SHOWCASE ================= */}
      <section id="rewards" className="py-24 border-t border-white/[0.06] bg-gradient-to-b from-black via-[#20222f]/10 to-black relative">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Web3 Reward Engine</h2>
          <p className="text-[#a5a1ac] max-w-xl mx-auto mb-16">
            Complete challenges, participate in local activities, and build up your blockchain wallet balance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Token Card (Glassmorphic) */}
            <div className="p-8 rounded-3xl bg-[#20222f]/40 backdrop-blur-xl border border-white/[0.08] hover:border-[#36BCCB]/30 transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-[#36BCCB]/10 flex items-center justify-center border border-[#36BCCB]/20 group-hover:scale-110 transition-transform">
                  <Coins className="h-6 w-6 text-[#36BCCB]" />
                </div>
                <h3 className="text-xl font-bold">SOLO Utility Tokens</h3>
                <p className="text-sm text-[#a5a1ac] leading-relaxed">
                  Earn native utility tokens by participating in local meetups, checking into orbits, and creating engaging threads.
                </p>
              </div>
              <div className="mt-8 text-2xl font-black text-white">$SOLO</div>
            </div>

            {/* Badges NFT Card (Glassmorphic) */}
            <div className="p-8 rounded-3xl bg-[#20222f]/40 backdrop-blur-xl border border-white/[0.08] hover:border-[#36BCCB]/30 transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Proof of Activity Badges</h3>
                <p className="text-sm text-[#a5a1ac] leading-relaxed">
                  Collect uniquely minted metadata NFT badges for completing localized quests and riddle challenges.
                </p>
              </div>
              <div className="mt-8 text-2xl font-black text-purple-400">ERC-721</div>
            </div>

            {/* Verification Card (Glassmorphic) */}
            <div className="p-8 rounded-3xl bg-[#20222f]/40 backdrop-blur-xl border border-white/[0.08] hover:border-[#36BCCB]/30 transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-[#F9FF54]/10 flex items-center justify-center border border-[#F9FF54]/20 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-[#F9FF54]" />
                </div>
                <h3 className="text-xl font-bold">Encrypted Web3 Wallet</h3>
                <p className="text-sm text-[#a5a1ac] leading-relaxed">
                  Securely view and manage all your achievements, tokens, and community passes in a native cryptographic portal.
                </p>
              </div>
              <div className="mt-8 text-2xl font-black text-[#F9FF54]">METAMASK</div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 border-t border-white/[0.06]">
        <h2 className="text-3xl font-extrabold text-center mb-12">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {[
            {
              q: "What is an Orbit?",
              a: "An Orbit is a local community hub centered around a location or shared interest. It can range from a university club to local running groups, neighborhood watch boards, or gaming guilds."
            },
            {
              q: "How does the Radar scanner function?",
              a: "Using safe geolocation permissions, the Radar displays active orbits and public events near your current coordinates. It is updated in real-time as users host meets."
            },
            {
              q: "What are the SOLO utility tokens?",
              a: "SOLO is a gamified proof-of-concept utility token awarded to community organizers and active members who verify check-ins at local community challenge points."
            },
            {
              q: "Do I need a Web3 wallet to start?",
              a: "No wallet is required! You can complete signup and explore orbits instantly. You can choose to hook up your MetaMask/WalletConnect wallet later to claim collectibles."
            }
          ].map((faq, index) => {
            const isOpen = activeAccordion === index;
            return (
              <div key={index} className="border border-white/[0.08] rounded-2xl bg-[#20222f]/20 overflow-hidden transition-colors">
                <button
                  onClick={() => setActiveAccordion(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left font-bold flex justify-between items-center hover:bg-[#20222f]/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-[#36BCCB] font-bold"
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-6 pb-5 text-sm text-[#a5a1ac] leading-relaxed border-t border-white/[0.06] pt-4 bg-[#20222f]/10"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-28 px-6 text-center max-w-4xl mx-auto">
        <div className="relative p-12 sm:p-20 rounded-[32px] bg-[#20222f]/30 backdrop-blur-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-[#36BCCB]/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#36BCCB/10,transparent_70%)] pointer-events-none" />
          
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 relative z-10">Ready to find your orbit?</h2>
          <p className="text-[#a5a1ac] text-lg mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
            Create an account, scan your local grid, and connect with vibrant communities that match your wavelength.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto font-bold">
            <Link href="/signup" className="px-8 py-4 text-base font-bold bg-[#36BCCB] text-black rounded-xl hover:bg-[#F9FF54] transition-all shadow-xl shadow-[#36BCCB]/20">
              Join Orbiting Now
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/[0.06] px-6 py-12 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Orbiting" width={28} height={28} className="rounded-full" />
            <span className="font-extrabold text-lg tracking-tight">Orbiting</span>
          </div>

          <p className="text-xs text-[#a5a1ac]">
            © {new Date().getFullYear()} Orbiting. Engineered for local community hubs and next-generation Web3 experiences.
          </p>

          <div className="flex gap-4 text-xs text-[#a5a1ac]">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
