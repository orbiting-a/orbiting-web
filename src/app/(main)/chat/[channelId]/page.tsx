"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ArrowLeft, Phone, Video, MoreHorizontal, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getChannel,
  getMessages,
  getChannelMembers,
  sendMessage,
  subscribeToMessages,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import type { Channel, Message, Profile } from "@/types/database";

export default function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = use(params);
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<(Message & { profiles: Profile })[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId || channelId === "undefined") {
      router.replace("/chat");
      return;
    }
    getCurrentUser().then((u) => u && setCurrentUserId(u.id));
  }, [channelId, router]);

  useEffect(() => {
    if (!channelId || channelId === "undefined") {
      router.replace("/chat");
      return;
    }
    async function load() {
      const ch = await getChannel(channelId);
      if (!ch) {
        setLoading(false);
        return;
      }
      setChannel(ch);

      try {
        const [msgs, mems] = await Promise.all([
          getMessages(channelId),
          getChannelMembers(channelId),
        ]);
        setMessages(msgs);
        setMembers(mems);
      } catch {
        // non-fatal
      }

      setLoading(false);
    }
    load();
  }, [channelId, router]);

  useEffect(() => {
    if (!channelId || channelId === "undefined") return;
    const sub = subscribeToMessages(channelId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => { void sub.unsubscribe(); };
  }, [channelId]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        const msg = await sendMessage(channelId, content);
        if (msg) {
          setMessages((prev) => [...prev, msg]);
        } else {
          toast.error("Failed to send message");
        }
      } catch {
        toast.error("Failed to send message");
      }
    },
    [channelId]
  );

  // DM channel title = other person's name
  const otherMembers = members.filter((m) => m.id !== currentUserId);
  const title = channel?.type === "dm"
    ? otherMembers.map((m) => m.display_name || m.username).join(", ") || "Chat"
    : channel?.name || "Channel";

  const subtitle = channel?.type === "dm"
    ? otherMembers.length === 1
      ? `@${otherMembers[0].username}`
      : `${otherMembers.length} participants`
    : `${members.length} members`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-muted">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-8 text-center">
        <MessageCircle className="h-12 w-12 text-text-muted mb-4" />
        <p className="text-text-muted text-sm">Conversation not available</p>
        <Link href="/chat" className="mt-4 text-brand-500 text-sm font-medium hover:underline">
          Back to chats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/chat"
            className="lg:hidden p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {channel?.type === "dm" ? (
            <Avatar
              name={title}
              size="sm"
              src={otherMembers[0]?.avatar_url}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-brand-400/20 flex items-center justify-center">
              <span className="text-brand-400 font-bold text-sm">#</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm truncate">
              {title}
            </p>
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            <Video className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
