"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui";
import { Send, Smile, Paperclip } from "lucide-react";

export function ChatInput({ onSend }: { onSend: (content: string) => void }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    await onSend(content.trim());
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

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0">
          <Paperclip className="h-5 w-5" />
        </button>
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
        <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0">
          <Smile className="h-5 w-5" />
        </button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={!content.trim()}
          loading={sending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
