"use client";

import { useState } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { Image, Video, BarChart3, X, Plus, Trash2 } from "lucide-react";
import { createPost, uploadMedia, createPoll } from "@/lib/supabase/queries";

export function CreatePost({
  orbitId,
  onPostCreated,
}: {
  orbitId?: string;
  onPostCreated?: () => void;
}) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0 && !showPoll) return;
    setPosting(true);

    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const url = await uploadMedia(
          file,
          `posts/${Date.now()}_${file.name}`
        );
        if (url) mediaUrls.push(url);
      }

      const post = await createPost({
        orbit_id: orbitId || "",
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        media_type: showPoll ? "poll" : mediaFiles.length > 0 ? "image" : "text",
      });

      if (post && showPoll && pollQuestion.trim() && pollOptions.some((o) => o.trim())) {
        await createPoll(
          post.id,
          pollQuestion.trim(),
          pollOptions.filter((o) => o.trim())
        );
      }

      setContent("");
      setMediaFiles([]);
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setIsExpanded(false);
      onPostCreated?.();
    } finally {
      setPosting(false);
    }
  };

  const handleFileSelect = (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      setMediaFiles((prev) => [...prev, ...files]);
    };
    input.click();
  };

  return (
    <Card padding="md">
      <div className="flex gap-3">
        <Avatar name="You" size="md" />
        <div className="flex-1 min-w-0">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-sm text-text-muted hover:text-text-secondary hover:border-border transition-colors"
            >
              Share something with your orbit...
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[100px] bg-transparent text-text-primary text-sm resize-none placeholder:text-text-muted focus:outline-none leading-relaxed"
              />

              {mediaFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mediaFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative h-16 w-16 rounded-lg overflow-hidden bg-surface-raised border border-border-subtle"
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-text-muted">
                          <Video className="h-5 w-5" />
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showPoll && (
                <div className="space-y-2 p-3 rounded-xl bg-surface-raised border border-border-subtle">
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/20 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                    >
                      <Plus className="h-3 w-3" /> Add option
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFileSelect("image")}
                    className="p-2 rounded-lg text-text-muted hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    title="Add photos"
                  >
                    <Image className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileSelect("video")}
                    className="p-2 rounded-lg text-text-muted hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    title="Add video"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPoll(!showPoll)}
                    className={`p-2 rounded-lg transition-colors ${
                      showPoll ? "text-brand-400 bg-brand-50 dark:bg-brand-900/20" : "text-text-muted hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                    }`}
                    title="Add poll"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                      setMediaFiles([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    loading={posting}
                    disabled={!content.trim() && mediaFiles.length === 0}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
