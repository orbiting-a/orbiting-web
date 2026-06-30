"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrbitCard } from "@/components/orbit/OrbitCard";
import { Skeleton } from "@/components/ui";
import { getOrbits, searchOrbits } from "@/lib/supabase/queries";
import { Search, Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Orbit } from "@/types/database";

const categories = [
  "All",
  "Technology",
  "Music",
  "Gaming",
  "Art",
  "Sports",
  "Education",
  "Business",
  "Social",
  "Health",
  "Travel",
];

const PAGE_SIZE = 12;

export default function DiscoverPage() {
  const [orbits, setOrbits] = useState<Orbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (category: string, searchQuery: string) => {
    setLoading(true);
    if (searchQuery.trim()) {
      const results = await searchOrbits(searchQuery);
      setOrbits(results);
      setHasMore(false);
    } else {
      const data = await getOrbits({
        category: category === "All" ? undefined : category,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setOrbits(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || search.trim()) return;
    setLoadingMore(true);
    const data = await getOrbits({
      category: activeCategory === "All" ? undefined : activeCategory,
      limit: PAGE_SIZE,
      offset: orbits.length,
    });
    if (data.length < PAGE_SIZE) setHasMore(false);
    setOrbits((prev) => [...prev, ...data]);
    setLoadingMore(false);
  }, [loadingMore, hasMore, search, activeCategory, orbits.length]);

  useEffect(() => {
    load(activeCategory, search);
  }, [search, activeCategory, load]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Discover</h1>
        <Link href="/create-orbit">
          <span className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
            + Create Orbit
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orbits..."
          className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat
                ? "bg-brand-500 text-white"
                : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-surface-raised border border-border-subtle p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 !rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : orbits.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Compass className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="font-bold text-text-primary mb-1">
            {search ? "No orbits found" : "No orbits yet"}
          </h3>
          <p className="text-sm text-text-muted mb-4">
            {search
              ? `No results for "${search}"`
              : "Be the first to create an orbit!"}
          </p>
          <Link href="/create-orbit">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
              Create Your First Orbit
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {orbits.map((orbit) => (
            <OrbitCard key={orbit.id} orbit={orbit} />
          ))}
          {loadingMore && (
            <div className="col-span-full flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}
          <div ref={sentinelRef} className="col-span-full h-4" />
        </div>
      )}
    </div>
  );
}
