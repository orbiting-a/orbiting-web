"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { ArrowLeft, Ban, UserX } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";

export default function BlockedUsersPage() {
  const supabase = createClient();
  const [blocked, setBlocked] = useState<{ id: string; username: string; display_name: string | null; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      const { data } = await supabase
        .from("follows")
        .select("profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
        .eq("follower_id", "blocked_placeholder");
      setBlocked([]);
      setLoading(false);
    });
  }, [supabase]);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Blocked Users</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} padding="md" className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-border-subtle" />
                <div className="h-4 w-24 bg-border-subtle rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : blocked.length === 0 ? (
        <Card padding="lg" className="flex flex-col items-center py-12 text-center">
          <Ban className="h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No blocked users</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocked.map((u) => (
            <Card key={u.id} padding="md" className="flex items-center gap-3">
              <Avatar name={u.display_name || u.username} size="sm" src={u.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{u.display_name || u.username}</p>
                <p className="text-xs text-text-muted">@{u.username}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<UserX className="h-4 w-4" />}>
                Unblock
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
