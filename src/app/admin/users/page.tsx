"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Search, Shield, ShieldOff, Loader2 } from "lucide-react";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setUsers(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = search.trim()
    ? users.filter((u) =>
        (u.display_name || u.username)?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Users</h1>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
      </div>

      <div className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle">
          <div className="col-span-4">User</div>
          <div className="col-span-3">Username</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1" />
        </div>
        {filtered.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border-subtle last:border-0 hover:bg-brand-50/5 transition-colors"
          >
            <div className="col-span-4 flex items-center gap-3">
              <Avatar name={user.display_name || user.username} size="sm" src={user.avatar_url} />
              <span className="text-sm font-medium text-text-primary truncate">
                {user.display_name || user.username}
              </span>
            </div>
            <div className="col-span-3 text-sm text-text-muted">@{user.username}</div>
            <div className="col-span-2 text-sm text-text-muted">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
            <div className="col-span-2">
              {user.is_verified ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">Verified</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">Pending</span>
              )}
            </div>
            <div className="col-span-1 flex justify-end">
              <Button variant="ghost" size="sm" icon={user.is_verified ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
