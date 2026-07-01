"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/ChatList";
import { MessageCircle, Search, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { createDMChannel, searchProfiles } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

export default function ChatPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchProfiles(search);
      const currentUser = await getCurrentUser();
      setSearchResults(results.filter((p) => p.id !== currentUser?.id));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const startDM = async (profile: Profile) => {
    setCreating(profile.id);
    try {
      const channel = await createDMChannel(profile.id);
      if (channel) {
        setSearch("");
        setSearchResults([]);
        router.push(`/chat/${channel.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start chat");
    }
    setCreating(null);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-text-primary mb-3">Chat</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        {search.trim().length >= 2 && (
          <div className="max-h-60 overflow-y-auto border-b border-border">
            {searchResults.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No users found</p>
            ) : (
              <div className="p-2 space-y-0.5">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => startDM(profile)}
                    disabled={creating === profile.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-raised transition-colors text-left"
                  >
                    <Avatar name={profile.display_name || "U"} size="sm" src={profile.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{profile.display_name || profile.username}</p>
                      <p className="text-xs text-text-muted truncate">@{profile.username}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <ChatList search="" />
        </div>
      </div>

      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-brand-400/10 flex items-center justify-center mb-5">
          <MessageCircle className="h-10 w-10 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Your messages</h2>
        <p className="text-sm text-text-muted max-w-sm">
          Search for someone above to start a conversation
        </p>
      </div>
    </div>
  );
}
