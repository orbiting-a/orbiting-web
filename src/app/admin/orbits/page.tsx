"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Search, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Orbit } from "@/types/database";

export default function AdminOrbitsPage() {
  const supabase = createClient();
  const [orbits, setOrbits] = useState<Orbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orbits")
        .select("*")
        .order("member_count", { ascending: false })
        .limit(50);
      setOrbits(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = search.trim()
    ? orbits.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : orbits;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Orbits</h1>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orbits..."
          className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
      </div>

      <div className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle">
          <div className="col-span-4">Orbit</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Members</div>
          <div className="col-span-2">Privacy</div>
          <div className="col-span-2">Actions</div>
        </div>
        {filtered.map((orbit) => (
          <div
            key={orbit.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border-subtle last:border-0 hover:bg-brand-50/5 transition-colors"
          >
            <div className="col-span-4 flex items-center gap-3">
              <Avatar name={orbit.name} size="sm" src={orbit.logo_url} />
              <div className="min-w-0">
                <Link href={`/orbit/${orbit.slug}`} className="text-sm font-medium text-text-primary hover:underline truncate block">
                  {orbit.name}
                </Link>
                {orbit.description && (
                  <p className="text-xs text-text-muted truncate">{orbit.description}</p>
                )}
              </div>
            </div>
            <div className="col-span-2 text-sm text-text-muted">{orbit.category || "—"}</div>
            <div className="col-span-2 text-sm text-text-muted">{orbit.member_count}</div>
            <div className="col-span-2">
              {orbit.is_private ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">Private</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">Public</span>
              )}
            </div>
            <div className="col-span-2 flex gap-1">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm" icon={<Trash2 className="h-3 w-3 text-red-400" />} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
