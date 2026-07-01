"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui";
import { Send, Smile, Paperclip, Image, File, X } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "👍", "👎", "❤️", "🔥", "🎉", "✨", "💯", "🙏",
  "😂", "🤣", "😊", "🙂", "😉", "😌", "😏", "😴",
  "😋", "🤗", "😇", "🥳", "🤩", "😈", "👀", "💀",
  "🎶", "💪", "🤝", "👋", "✌️", "🤞", "👏", "🙌",
];

export function ChatInput({
  onSend,
  onSendFile,
}: {
  onSend: (content: string) => void;
  onSendFile?: (file: File) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if ((!content.trim() && !filePreview) || sending) return;
    setSending(true);
    if (filePreview) {
      await onSendFile?.(filePreview);
      setFilePreview(null);
    }
    if (content.trim()) {
      await onSend(content.trim());
    }
    setContent("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilePreview(file);
    }
    e.target.value = "";
  };

  const isImage = filePreview?.type.startsWith("image/");

  return (
    <div className="border-t border-border p-4 relative">
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-4 mb-2 bg-surface-raised border border-border-subtle rounded-xl shadow-lg p-3 grid grid-cols-8 gap-1 z-10"
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-hover rounded-lg text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {filePreview && (
        <div className="mb-3 p-2 bg-surface-raised rounded-xl border border-border-subtle flex items-center gap-3">
          {isImage ? (
            <img
              src={URL.createObjectURL(filePreview)}
              alt="Preview"
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-brand-400/10 flex items-center justify-center">
              <File className="h-5 w-5 text-brand-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{filePreview.name}</p>
            <p className="text-xs text-text-muted">{(filePreview.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={() => setFilePreview(null)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none max-h-32"
            style={{ minHeight: "40px" }}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={!content.trim() && !filePreview}
          loading={sending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
