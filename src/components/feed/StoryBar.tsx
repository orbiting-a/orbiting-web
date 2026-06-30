"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui";
import Image from "next/image";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { getStories, createStory, uploadMedia } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import type { Story, Profile } from "@/types/database";

export function StoryBar() {
  const [stories, setStories] = useState<(Story & { profiles: Profile })[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getStories().then((data) => setStories(data as (Story & { profiles: Profile })[]));
    getCurrentUser().then((u) => setCurrentUserId(u?.id || null));
  }, []);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `stories/${currentUserId}/${Date.now()}-${file.name}`;
    try {
      const url = await uploadMedia(file, path);
      await createStory(url);
      toast.success("Story added!");
      const updated = await getStories();
      setStories(updated as (Story & { profiles: Profile })[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload story");
    }
    setShowCreate(false);
    setUploading(false);
  };

  const groupedStories = stories.reduce((acc, story) => {
    if (!acc.find((s) => s.user_id === story.user_id)) acc.push(story);
    return acc;
  }, [] as (Story & { profiles: Profile })[]);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        <button
          onClick={() => setShowCreate(true)}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="h-14 w-14 rounded-full bg-brand-500/20 border-2 border-dashed border-brand-400 flex items-center justify-center">
            <Plus className="h-5 w-5 text-brand-400" />
          </div>
          <span className="text-[10px] text-text-muted">Add Story</span>
        </button>

        {groupedStories.map((story) => (
          <button key={story.id} className="flex flex-col items-center gap-1 shrink-0">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-surface-raised overflow-hidden">
                {story.profiles?.avatar_url ? (
                  <Image src={story.profiles.avatar_url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-text-primary">
                    {(story.profiles?.display_name || "U")[0]}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-text-muted truncate max-w-[56px]">
              {story.profiles?.display_name?.split(" ")[0] || story.profiles?.username}
            </span>
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-20 w-20 rounded-full bg-brand-500/20 border-2 border-dashed border-brand-400 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-brand-400" />
            </div>
            <h3 className="font-bold text-text-primary mb-1">Add to Your Story</h3>
            <p className="text-sm text-text-muted mb-4">Share a photo that disappears after 24 hours</p>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-brand-600">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Choose Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleCreateStory} />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
