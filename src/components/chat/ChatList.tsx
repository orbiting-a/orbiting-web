"use client";

import { useState, useEffect, useMemo } from "react";
import { useChatStore } from "@/lib/chat-store";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMyChannels, getChannelMembers, getChannelLastMessage, getUnreadCounts, leaveChannel } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { MessageCircle, Hash, Trash2, CheckCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Channel, Profile } from "@/types/database";

export function ChatList({ filter = "All" }: { filter?: string }) {
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, Profile[]>>({});
  const [lastMsgMap, setLastMsgMap] = useState<Record<string, { content: string | null; media_url: string | null; created_at: string } | null>>({});
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { unreadCounts, fetchUnread } = useChatStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((u) => setCurrentUser(u));
  }, []);

  useEffect(() => {
    async function load() {
      const channels = await getMyChannels();
      setConversations(channels);

      const mm: Record<string, Profile[]> = {};
      const lm: Record<string, { content: string | null; media_url: string | null; created_at: string } | null> = {};
      await Promise.all([
        fetchUnread(),
        Promise.all(channels.map(async (ch) => {
          const [members, lastMsg] = await Promise.all([
            getChannelMembers(ch.id),
            getChannelLastMessage(ch.id),
          ]);
          mm[ch.id] = members;
          lm[ch.id] = lastMsg;
        })),
      ]);
      setMembersMap(mm);
      setLastMsgMap(lm);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [pathname]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!currentUser) return;
    const { createClient } = require("@/lib/supabase/client");
    const supabase = createClient();
    const channel = supabase
      .channel("chat-list-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg) return;
          if (newMsg.sender_id === currentUser.id) return;

          const activeChannelId = pathname.split("/").pop();
          if (activeChannelId === newMsg.channel_id) return;

          setLastMsgMap((prev) => ({
            ...prev,
            [newMsg.channel_id]: {
              content: newMsg.content || (newMsg.media_url ? "📁 Media file" : null),
              created_at: newMsg.created_at,
            },
          }));

          useChatStore.getState().incrementUnread(newMsg.channel_id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, pathname]);

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === "visible") fetchUnread(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const filtered = useMemo(() => {
    let result = conversations;
    if (filter === "DMs") result = result.filter((ch) => ch.type === "dm");
    else if (filter === "Groups") result = result.filter((ch) => ch.type === "group" || ch.type === "orbit_channel");
    return result;
  }, [conversations, filter]);

  const getOtherUser = (ch: Channel): Profile | undefined => {
    if (ch.type !== "dm") return undefined;
    const members = membersMap[ch.id] || [];
    return members.find((m) => m.id !== currentUser?.id) || members[0];
  };

  const getLastMsgText = (ch: Channel) => {
    const lastMsg = lastMsgMap[ch.id];
    if (!lastMsg) return null;
    return lastMsg.content || (lastMsg.media_url ? "📁 Media file" : null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    let failed = 0;
    for (const id of selected) {
      try { await leaveChannel(id); setConversations((prev) => prev.filter((ch) => ch.id !== id)); }
      catch { failed++; }
    }
    setSelected(new Set());
    setSelectMode(false);
    setDeleting(false);
    toast.success(failed === 0 ? `Left ${selected.size}` : `Failed to leave ${failed}`);
  };

  const cancelSelect = () => { setSelectMode(false); setSelected(new Set()); };

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-border-subtle animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-border-subtle rounded animate-pulse" />
              <div className="h-2 w-20 bg-border-subtle rounded animate-pulse" />
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
          {filter === "All" ? "Search for someone above to start chatting" : `No ${filter.toLowerCase()} yet`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      <div className="flex items-center justify-between px-3 py-1">
        {selectMode ? (
          <>
            <span className="text-xs text-text-muted">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={cancelSelect} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
              <button onClick={handleDeleteSelected} disabled={selected.size === 0 || deleting}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Leaving..." : `Leave (${selected.size})`}
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => setSelectMode(true)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary">
            <CheckCheck className="h-3.5 w-3.5" /> Select
          </button>
        )}
      </div>

      {filtered.map((ch) => {
        const isActive = pathname === `/chat/${ch.id}`;
        const isDM = ch.type === "dm";
        const otherUser = getOtherUser(ch);
        const name = isDM ? otherUser?.display_name || otherUser?.username || "Unknown" : ch.name || "Unnamed";
        const lastMsgText = getLastMsgText(ch);
        const isSelected = selected.has(ch.id);
        const unread = unreadCounts[ch.id] || 0;

        if (selectMode) {
          return (
            <button key={ch.id} onClick={() => toggleSelect(ch.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                isSelected ? "bg-brand-500/10 ring-1 ring-brand-500" : "text-text-secondary hover:glass-card"
              )}>
              <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                isSelected ? "bg-brand-500 border-brand-500" : "border-border-subtle")}>
                {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              {isDM && otherUser ? <Avatar name={name} size="sm" src={otherUser.avatar_url} /> : (
                <div className="h-8 w-8 rounded-full bg-brand-400/20 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-brand-400" /></div>)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{name}</p>
                {lastMsgText && <p className="text-xs text-text-muted truncate mt-0.5">{lastMsgText}</p>}
              </div>
              {unread > 0 && <span className="shrink-0 h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}</span>}
            </button>
          );
        }

        return (
          <Link key={ch.id} href={`/chat/${ch.id}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isActive ? "glass-card-static glow-brand" : "text-text-secondary hover:glass-card"
            )}>
            {isDM && otherUser ? <Avatar name={name} size="sm" src={otherUser.avatar_url} /> : (
              <div className="h-8 w-8 rounded-full bg-brand-400/20 flex items-center justify-center">
                <Hash className="h-4 w-4 text-brand-400" /></div>)}
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium truncate", isActive && "text-brand-400")}>{name}</p>
              {lastMsgText && <p className={cn("text-xs truncate mt-0.5", isActive ? "text-white/70" : "text-text-muted")}>{lastMsgText}</p>}
            </div>
            {unread > 0 && (
              <span className={cn("shrink-0 h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold",
                isActive ? "bg-white text-brand-500" : "bg-brand-500 text-white")}>
                {unread > 99 ? "99+" : unread}</span>)}
          </Link>
        );
      })}
    </div>
  );
}
