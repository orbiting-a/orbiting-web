"use client";

import { useState, useEffect } from "react";
import { Card, Avatar } from "@/components/ui";
import { Search, Users, Globe, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchAll } from "@/lib/supabase/queries";

type SearchResults = {
  orbits: { id: string; name: string; slug: string; logo_url: string | null; member_count: number; category: string | null }[];
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }[];
  posts: { id: string; content: string; created_at: string; author_id: string; profiles: { username: string; display_name: string | null }[] }[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchAll(query.trim());
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const filters = ["All", "Orbits", "People", "Posts"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="relative w-full mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orbits, people, posts..."
          className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          autoFocus
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter
                ? "bg-brand-500 text-white"
                : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
        </div>
      )}

      {!query.trim() && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="font-bold text-text-primary mb-1">Search Orbiting</h3>
          <p className="text-sm text-text-muted max-w-sm">
            Find orbits, people, and posts across the platform
          </p>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          {(activeFilter === "All" || activeFilter === "Orbits") &&
            results.orbits.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Orbits ({results.orbits.length})
                </h3>
                <div className="space-y-2">
                  {results.orbits.map((orbit) => (
                    <Link key={orbit.id} href={`/orbit/${orbit.slug}`}>
                      <Card
                        hover
                        padding="sm"
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          name={orbit.name}
                          size="sm"
                          src={orbit.logo_url}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">
                            {orbit.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {orbit.member_count} members
                            {orbit.category && ` · ${orbit.category}`}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {(activeFilter === "All" || activeFilter === "People") &&
            results.profiles.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  People ({results.profiles.length})
                </h3>
                <div className="space-y-2">
                  {results.profiles.map((profile) => (
                    <Link key={profile.id} href={`/profile/${profile.id}`}>
                      <Card
                        hover
                        padding="sm"
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          name={profile.display_name || profile.username}
                          size="sm"
                          src={profile.avatar_url}
                        />
                        <div>
                          <p className="font-medium text-text-primary text-sm">
                            {profile.display_name || profile.username}
                          </p>
                          <p className="text-xs text-text-muted">
                            @{profile.username}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {(activeFilter === "All" || activeFilter === "Posts") &&
            results.posts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Posts ({results.posts.length})
                </h3>
                <div className="space-y-2">
                  {results.posts.map((post) => (
                    <Link key={post.id} href={`/post/${post.id}`}>
                      <Card hover padding="sm">
                        <p className="text-sm text-text-primary line-clamp-2">
                          {post.content}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {post.profiles?.[0]?.display_name || post.profiles?.[0]?.username || "Unknown"}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {results.orbits.length === 0 &&
            results.profiles.length === 0 &&
            results.posts.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <Search className="h-10 w-10 text-text-muted mb-3" />
                <h3 className="font-bold text-text-primary mb-1">
                  No results found
                </h3>
                <p className="text-sm text-text-muted">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
