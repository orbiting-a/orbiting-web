"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";
import { StoryBar } from "@/components/feed/StoryBar";
import { Skeleton } from "@/components/ui";
import { getFeedPosts } from "@/lib/supabase/queries";
import { Compass, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Post, Profile, Orbit } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

const PAGE_SIZE = 10;

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    const data = await getFeedPosts({ limit: PAGE_SIZE, offset: 0 });
    setPosts(data as PostWithRelations[]);
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const data = await getFeedPosts({ limit: PAGE_SIZE, offset: posts.length });
    if (data.length < PAGE_SIZE) setHasMore(false);
    setPosts((prev) => [...prev, ...(data as PostWithRelations[])]);
    setLoadingMore(false);
  }, [loadingMore, hasMore, posts.length]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-text-primary">Feed</h1>
        <button
          onClick={() => loadPosts(true)}
          disabled={refreshing}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <StoryBar />
      <CreatePost onPostCreated={() => loadPosts(true)} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-surface-raised border border-border-subtle p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 !rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Compass className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="font-bold text-text-primary mb-1">Your feed is empty</h3>
          <p className="text-sm text-text-muted mb-4 max-w-sm">
            Join some orbits to see posts from your communities here
          </p>
          <Link href="/discover">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
              <Compass className="h-4 w-4" />
              Discover Orbits
            </span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}
          <div ref={sentinelRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
