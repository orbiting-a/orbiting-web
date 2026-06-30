"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { Heart, MessageCircle, SkipForward, Loader2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { getReels } from "@/lib/supabase/queries";
import type { Post, Profile, Orbit } from "@/types/database";

type ReelWithRelations = Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> };

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getReels().then((data) => {
      setReels(data as ReelWithRelations[]);
      setLoading(false);
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== currentIndex) setCurrentIndex(index);
  }, [currentIndex]);

  const nextReel = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      containerRef.current?.children[currentIndex + 1]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-brand-400/10 flex items-center justify-center mb-5">
          <MessageCircle className="h-10 w-10 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">No reels yet</h2>
        <p className="text-sm text-text-muted max-w-sm">Create a reel by selecting Reel when creating a post</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-3.5rem)] overflow-y-auto snap-y snap-mandatory scrollbar-hide"
    >
      {reels.map((reel, i) => (
        <div key={reel.id} className="h-full snap-start snap-always relative flex items-center justify-center bg-black">
          {reel.media_urls?.[0] ? (
            <img
              src={reel.media_urls[0]}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-white text-lg font-bold">{reel.content}</p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/profile/${reel.author_id}`}>
                <Avatar name={reel.profiles?.display_name || "U"} size="sm" src={reel.profiles?.avatar_url} />
              </Link>
              <div>
                <Link href={`/profile/${reel.author_id}`} className="text-white font-bold text-sm">
                  {reel.profiles?.display_name || reel.profiles?.username}
                </Link>
                {reel.content && <p className="text-white/80 text-xs mt-0.5">{reel.content}</p>}
              </div>
            </div>
          </div>

          <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5">
            <button className="flex flex-col items-center gap-1 text-white">
              <Heart className="h-7 w-7" />
              <span className="text-xs">{reel.like_count}</span>
            </button>
            <Link href={`/post/${reel.id}`} className="flex flex-col items-center gap-1 text-white">
              <MessageCircle className="h-7 w-7" />
              <span className="text-xs">{reel.comment_count}</span>
            </Link>
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {i < reels.length - 1 && (
            <button
              onClick={nextReel}
              className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
