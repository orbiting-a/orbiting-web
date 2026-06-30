"use client";

import { useState, useEffect } from "react";
import { Card, Avatar } from "@/components/ui";
import { ImageModal } from "@/components/ui/ImageModal";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toggleLike, votePoll, getPollVote } from "@/lib/supabase/queries";
import { thumbnailUrl } from "@/lib/compress-image";
import type { Post, Profile, Orbit } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

export function PostCard({
  post,
  liked: initialLiked = false,
}: {
  post: PostWithRelations;
  liked?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [pollVote, setPollVote] = useState(-1);
  const [pollOptions, setPollOptions] = useState<{ text: string; votes: number }[]>(post.poll?.options || []);
  const [totalVotes, setTotalVotes] = useState(0);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    if (post.poll) {
      getPollVote(post.poll.id).then(setPollVote);
      setTotalVotes(post.poll.options.reduce((s, o) => s + o.votes, 0));
    }
  }, [post.poll]);

  const handleVote = async (index: number) => {
    if (pollVote >= 0 || !post.poll) return;
    const result = await votePoll(post.poll.id, index);
    if (result.voted) {
      setPollVote(index);
      setPollOptions((prev) => prev.map((o, i) => i === index ? { ...o, votes: o.votes + 1 } : o));
      setTotalVotes((v) => v + 1);
    }
  };

  const handleLike = async () => {
    const prevLiked = liked;
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    const result = await toggleLike(post.id);
    if (result.liked === prevLiked) {
      setLiked(prevLiked);
      setLikeCount((c) => (prevLiked ? c + 1 : c - 1));
    }
  };

  return (
    <Card padding="md" className="group">
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/profile/${post.author_id}`}
          className="flex items-center gap-3"
        >
          <Avatar
            name={post.profiles?.display_name || post.profiles?.username || "U"}
            size="md"
            src={post.profiles?.avatar_url}
          />
          <div>
            <p className="font-semibold text-text-primary text-sm leading-tight">
              {post.profiles?.display_name || post.profiles?.username || "Unknown"}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>@{post.profiles?.username || "unknown"}</span>
              <span>·</span>
              <span>{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {post.orbits && (
            <Link
              href={`/orbit/${post.orbits.slug}`}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-400 hover:bg-brand-400/20 transition-colors"
            >
              {post.orbits.name}
            </Link>
          )}
          <button className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/post/${post.id}`}>
        <p className="text-text-primary mb-3 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </Link>

      {post.media_urls && post.media_urls.length > 0 && (
        <div
          className={`grid gap-0.5 mb-3 rounded-xl overflow-hidden ${
            post.media_urls.length === 1
              ? "grid-cols-1"
              : post.media_urls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
          }`}
        >
          {post.media_urls.slice(0, 4).map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              className="relative bg-surface-raised aspect-square overflow-hidden group/image"
            >
              <Image
                src={thumbnailUrl(url)}
                alt=""
                width={400}
                height={400}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {post.media_urls.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-bold">
                  +{post.media_urls.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {post.media_type === "poll" && post.poll && (
        <div className="mb-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-brand-400" />
            <p className="text-sm font-medium text-text-primary">{post.poll.question}</p>
          </div>
          <div className="space-y-1.5">
            {pollOptions.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isSelected = pollVote === i;
              return (
                <button
                  key={i}
                  onClick={() => handleVote(i)}
                  disabled={pollVote >= 0}
                  className={`relative w-full text-left px-3 py-2 rounded-lg text-sm transition-all overflow-hidden ${
                    isSelected
                      ? "bg-brand-500/20 border border-brand-500/40"
                      : pollVote >= 0
                        ? "bg-surface-raised border border-border-subtle"
                        : "bg-black/20 border border-border-subtle hover:border-brand-400/40"
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-brand-400/10 transition-all"
                    style={{ width: pollVote >= 0 ? `${pct}%` : "0%" }}
                  />
                  <span className="relative flex items-center justify-between">
                    <span>{opt.text}</span>
                    {pollVote >= 0 && (
                      <span className="text-xs text-text-muted">{pct}%</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {pollVote >= 0 && (
            <p className="text-xs text-text-muted mt-2">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-border-subtle">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked ? "text-red-500" : "text-text-muted hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-400 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </Link>
        <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-400 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
        <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-400 transition-colors ml-auto">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      {selectedImage !== null && (
        <ImageModal
          images={post.media_urls}
          initialIndex={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </Card>
  );
}

function formatTimeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
