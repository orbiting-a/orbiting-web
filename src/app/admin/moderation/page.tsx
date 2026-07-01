"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertTriangle, Check, X } from "lucide-react";
import type { Post, Profile, Orbit } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug">;
};

export default function AdminModerationPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug)")
        .order("created_at", { ascending: false })
        .limit(20);
      setPosts((data ?? []) as PostWithRelations[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleApprove = async (postId: string) => {
    setActionLoading(postId);
    // Approve by marking as reviewed (or simply pinning)
    // In a full moderation system, you might set a "moderation_status" column.
    // For now, we toggle is_pinned as a basic approval action.
    const { error } = await supabase
      .from("posts")
      .update({ is_pinned: true })
      .eq("id", postId);

    if (error) {
      console.error("Failed to approve post:", error.message);
    } else {
      // Remove from local state after approval
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    setActionLoading(null);
  };

  const handleRemove = async (postId: string) => {
    setActionLoading(postId);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Failed to remove post:", error.message);
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
        <h1 className="text-2xl font-bold text-text-primary">Moderation Queue</h1>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card padding="lg" className="text-center py-12">
            <p className="text-sm text-text-muted">No posts to moderate</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} padding="md">
              <div className="flex items-start gap-3">
                <Avatar
                  name={post.profiles?.display_name || post.profiles?.username || "U"}
                  size="sm"
                  src={post.profiles?.avatar_url}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {post.profiles?.display_name || post.profiles?.username}
                    </span>
                    {post.orbits && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-400">
                        {post.orbits.name}
                      </span>
                    )}
                    <span className="text-xs text-text-muted ml-auto">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Check className="h-3 w-3 text-green-400" />}
                      loading={actionLoading === post.id}
                      onClick={() => handleApprove(post.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X className="h-3 w-3 text-red-400" />}
                      loading={actionLoading === post.id}
                      onClick={() => handleRemove(post.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
