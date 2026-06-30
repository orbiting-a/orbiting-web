"use client";

import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import type { Message, Profile } from "@/types/database";
import { useEffect, useRef } from "react";

export function MessageList({
  messages,
  currentUserId,
  loading,
}: {
  messages: (Message & { profiles: Profile })[];
  currentUserId?: string;
  loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}
          >
            <div className="h-8 w-8 rounded-full bg-border-subtle animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-border-subtle rounded-xl animate-pulse" />
              <div className="h-3 w-16 bg-border-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-brand-400" />
        </div>
        <h3 className="font-bold text-text-primary mb-1">Start chatting</h3>
        <p className="text-sm text-text-muted max-w-xs">
          No messages yet. Say hello!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      {messages.map((msg) => {
        const isOwn = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={cn("flex gap-2 items-end", isOwn && "flex-row-reverse")}
          >
            {!isOwn && (
              <Avatar
                name={msg.profiles?.display_name || msg.profiles?.username || "?"}
                size="xs"
                src={msg.profiles?.avatar_url}
              />
            )}
            <div className={cn("flex flex-col", isOwn && "items-end")}>
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-sm max-w-xs sm:max-w-sm break-words",
                  isOwn
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "bg-surface-raised border border-border-subtle text-text-primary rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 px-1">
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
