"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMyChannels, getChannelMembers } from "@/lib/supabase/queries";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Channel, Profile } from "@/types/database";

export function ChatList({ search = "" }: { search?: string }) {
  const [conversations, setConversations] = useState<(Channel & { otherUser?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function load() {
      const channels = await getMyChannels();
      const dms = channels.filter((ch) => ch.type === "dm");
      const enriched: (Channel & { otherUser?: Profile })[] = [];
      for (const ch of dms) {
        const members = await getChannelMembers(ch.id);
        enriched.push({ ...ch, otherUser: members[0] });
      }
      setConversations(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = c.otherUser?.display_name || c.otherUser?.username || "";
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-border-subtle animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-border-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center px-4">
        <MessageCircle className="h-8 w-8 text-text-muted mb-2" />
        <p className="text-sm text-text-muted">No conversations yet</p>
        <p className="text-xs text-text-muted mt-1">
          Search for someone above to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {filtered.map((ch) => {
        const isActive = pathname === `/chat/${ch.id}`;
        const name = ch.otherUser?.display_name || ch.otherUser?.username || "Unknown";
        return (
          <Link
            key={ch.id}
            href={`/chat/${ch.id}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isActive
                ? "bg-brand-500 text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            )}
          >
            <Avatar name={name} size="sm" src={ch.otherUser?.avatar_url} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{name}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
