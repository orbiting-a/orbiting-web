"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMyChannels, getChannelMembers } from "@/lib/supabase/queries";
import { MessageCircle, Hash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Channel } from "@/types/database";

export function ChatList({ filter = "All", search = "" }: { filter?: string; search?: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function load() {
      const data = await getMyChannels();
      setChannels(data);

      // Load channel names (for DMs, use the other person's name)
      const names: Record<string, string> = {};
      for (const ch of data) {
        if (ch.type === "dm") {
          const members = await getChannelMembers(ch.id);
          names[ch.id] = members.map((m) => m.display_name || m.username).join(", ");
        } else {
          names[ch.id] = ch.name || "Unnamed";
        }
      }
      setChannelNames(names);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = channels;
    if (filter !== "All") {
      const type = filter === "DMs" ? "dm" : "orbit_channel";
      result = result.filter((ch) => ch.type === type || (filter === "Channels" && ch.type === "group"));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ch) => {
        const name = channelNames[ch.id] || "";
        return name.toLowerCase().includes(q);
      });
    }
    return result;
  }, [channels, channelNames, filter, search]);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-full bg-border-subtle animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-border-subtle rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-border-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center px-4">
          <MessageCircle className="h-8 w-8 text-text-muted mb-2" />
          <p className="text-sm text-text-muted">No conversations yet</p>
          <p className="text-xs text-text-muted mt-1">
            Start a chat from someone&apos;s profile
          </p>
        </div>
      ) : (
        filtered.map((ch) => {
          const isActive = pathname === `/chat/${ch.id}`;
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
              {ch.type === "dm" ? (
                <Avatar name={channelNames[ch.id] || "?"} size="sm" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-400/20 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-brand-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {channelNames[ch.id] || "Loading..."}
                </p>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
