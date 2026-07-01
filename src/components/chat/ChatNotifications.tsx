"use client";

import { useState, useEffect } from "react";
import { Bell, MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChatNotification {
  id: string;
  channel_id: string;
  channel_name: string;
  content: string | null;
  sender_name: string;
  created_at: string;
}

export function ChatNotifications() {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function setup() {
      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { data: channels } = await supabase
        .from("channel_members")
        .select("channel_id, last_read_at")
        .eq("user_id", user.id);

      if (!channels) { setLoading(false); return; }

      const unread: ChatNotification[] = [];
      for (const ch of channels) {
        let query = supabase
          .from("messages")
          .select("id, channel_id, content, created_at, profiles!sender_id(display_name, username)")
          .eq("channel_id", ch.channel_id)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (ch.last_read_at) {
          query = query.gt("created_at", ch.last_read_at);
        }
        const { data: msgs } = await query;
        if (msgs && msgs.length > 0) {
          const m = msgs[0] as unknown as {
            id: string;
            channel_id: string;
            content: string | null;
            created_at: string;
            profiles: { display_name: string | null; username: string };
          };
          unread.push({
            id: m.id,
            channel_id: m.channel_id,
            channel_name: "",
            content: m.content,
            sender_name: m.profiles?.display_name || m.profiles?.username || "Unknown",
            created_at: m.created_at,
          });
        }
      }

      setNotifications(unread);
      setLoading(false);
    }

    setup();
  }, []);

  const dismiss = (channelId: string) => {
    setNotifications((prev) => prev.filter((n) => n.channel_id !== channelId));
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center px-4">
        <Bell className="h-8 w-8 text-text-muted mb-2" />
        <p className="text-sm text-text-muted">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      <p className="text-xs text-text-muted px-3 py-2">{notifications.length} unread</p>
      {notifications.map((n) => (
        <div key={n.id} className="group relative">
          <Link
            href={`/chat/${n.channel_id}`}
            className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-raised transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="h-4 w-4 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary truncate">{n.sender_name}</p>
              <p className="text-xs text-text-muted truncate mt-0.5">{n.content || "Shared a file"}</p>
            </div>
          </Link>
          <button
            onClick={() => dismiss(n.channel_id)}
            className="absolute top-2 right-2 p-1 rounded text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
