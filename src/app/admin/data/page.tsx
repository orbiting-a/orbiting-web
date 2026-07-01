"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { toast } from "sonner";
import { Trash2, HardDrive, MessageCircle, Hash } from "lucide-react";

export default function AdminDataPage() {
  const [channelId, setChannelId] = useState("");
  const [clearing, setClearing] = useState<string | null>(null);

  const callAdmin = async (action: string, target?: string) => {
    setClearing(action + (target || ""));
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Done");
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Failed to execute");
    }
    setClearing(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Data Management</h1>

      <div className="space-y-6 max-w-2xl">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Clear Messages</h2>
              <p className="text-xs text-text-muted">Delete all messages in a specific channel</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Channel ID (leave empty to clear all)"
              className="flex-1 rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <Button
              variant="danger"
              onClick={() => callAdmin("clear_messages", channelId || undefined)}
              loading={clearing === "clear_messages" + (channelId || "")}
              disabled={clearing !== null}
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Delete Channel</h2>
              <p className="text-xs text-text-muted">Delete a channel and all its messages + members</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Channel ID"
              className="flex-1 rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <Button
              variant="danger"
              onClick={() => callAdmin("clear_channel", channelId)}
              loading={clearing === "clear_channel" + channelId}
              disabled={!channelId || clearing !== null}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Cloud Storage</h2>
              <p className="text-xs text-text-muted">Delete files from R2 storage</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Prefix path (e.g. avatars/, chat/)"
              id="storage-prefix"
              className="flex-1 rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <Button
              variant="danger"
              onClick={() => {
                const el = document.getElementById("storage-prefix") as HTMLInputElement;
                callAdmin("clear_storage", el?.value || undefined);
              }}
              loading={clearing?.startsWith("clear_storage")}
              disabled={clearing !== null}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          <p className="text-[10px] text-text-muted">
            Warning: This permanently deletes files from Cloudflare R2. Use with caution.
          </p>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Clean Empty DM Channels</h2>
              <p className="text-xs text-text-muted">Delete all DM channels that have zero messages</p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => callAdmin("clear_empty_channels")}
            loading={clearing === "clear_empty_channels"}
            disabled={clearing !== null}
          >
            <Trash2 className="h-4 w-4" />
            Clean Empty Channels
          </Button>
          <p className="text-[10px] text-text-muted">
            This scans all DM channels and permanently deletes any with 0 messages.
          </p>
        </Card>
      </div>
    </div>
  );
}
