"use client";

import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Trash2, File, Download, Check, CheckCheck, MoreVertical
} from "lucide-react";
import type { Message, Profile } from "@/types/database";
import { useEffect, useRef, useState } from "react";

export function MessageList({
  messages,
  currentUserId,
  loading,
  onDelete,
  onDeleteForEveryone,
}: {
  messages: (Message & { profiles: Profile })[];
  currentUserId?: string;
  loading: boolean;
  onDelete?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
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
      {messages.map((msg, idx) => {
        const isOwn = msg.sender_id === currentUserId;
        const showReadReceipt = isOwn && idx === messages.length - 1;
        return (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={isOwn}
            onDelete={onDelete}
            onDeleteForEveryone={onDeleteForEveryone}
            showReadReceipt={showReadReceipt}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)(\?.*)?$/i.test(url) || url.includes("image");
}

function isAudioUrl(url: string) {
  return /\.(mp3|wav|ogg|opus|m4a|aac|webm)(\?.*)?$/i.test(url) || url.includes("audio");
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

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return formatTime(date);
  if (isYesterday) return "Yesterday " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({
  msg,
  isOwn,
  onDelete,
  onDeleteForEveryone,
  showReadReceipt,
}: {
  msg: Message & { profiles: Profile };
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  showReadReceipt?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn("flex gap-2 items-end group", isOwn && "flex-row-reverse")}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {!isOwn && (
        <Avatar
          name={msg.profiles?.display_name || msg.profiles?.username || "?"}
          size="xs"
          src={msg.profiles?.avatar_url}
        />
      )}
      <div className={cn("flex flex-col relative max-w-[75%]", isOwn && "items-end")}>
        <div className="flex items-end gap-1">
          {isOwn && showMenu && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className={cn(
                    "absolute bottom-full mb-1 w-48 bg-surface-raised border border-border-subtle rounded-xl shadow-lg py-1 z-20",
                    isOwn ? "right-0" : "left-0"
                  )}>
                    {onDelete && (
                      <button
                        onClick={() => { setMenuOpen(false); onDelete(msg.id); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete for me
                      </button>
                    )}
                    {onDeleteForEveryone && (
                      <button
                        onClick={() => { setMenuOpen(false); onDeleteForEveryone(msg.id); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete for everyone
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <div
            className={cn(
              "px-3 py-2 rounded-2xl text-sm break-words overflow-hidden relative",
              isOwn
                ? "bg-brand-500 text-white rounded-br-md"
                : "bg-surface-raised border border-border-subtle text-text-primary rounded-bl-md"
            )}
          >
            {msg.media_url && (
              <div className="mb-1.5 -mx-3 -mt-2 first:mt-0">
                {isImageUrl(msg.media_url) ? (
                  <div className="relative">
                    <img
                      src={msg.media_url}
                      alt="Shared image"
                      className={cn(
                        "max-w-full rounded-t-2xl max-h-64 object-cover cursor-pointer",
                        msg.content && "rounded-b-none"
                      )}
                      onError={() => setImgError(true)}
                      onClick={() => window.open(msg.media_url!, "_blank")}
                    />
                    {imgError && (
                      <div className="h-32 bg-surface-hover flex items-center justify-center rounded-t-2xl">
                        <File className="h-6 w-6 text-text-muted" />
                      </div>
                    )}
                  </div>
                ) : isAudioUrl(msg.media_url) ? (
                  <div className={cn("p-3", isOwn ? "" : "")}>
                    <audio
                      src={msg.media_url}
                      controls
                      preload="metadata"
                      className="w-full h-10"
                      style={{ maxWidth: "240px" }}
                    />
                  </div>
                ) : (
                  <a
                    href={msg.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      isOwn ? "hover:bg-brand-600" : "hover:bg-surface-hover"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      isOwn ? "bg-brand-600" : "bg-surface-hover"
                    )}>
                      <File className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {msg.media_url.split("/").pop() || "File"}
                      </p>
                      <p className="text-xs opacity-70">Click to download</p>
                    </div>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                )}
              </div>
            )}
            {msg.content && (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px] text-text-muted">{formatDate(msg.created_at)}</span>
          {showReadReceipt && (
            <span className="text-[10px]">
              {msg.is_read ? (
                <CheckCheck className="h-3 w-3 text-blue-400" />
              ) : (
                <Check className="h-3 w-3 text-text-muted" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
