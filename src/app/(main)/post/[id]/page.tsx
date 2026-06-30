"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
  Send,
} from "lucide-react";
import Link from "next/link";
import { getPost, getComments, createComment, toggleLike, hasLiked } from "@/lib/supabase/queries";
import type { Post, Profile, Orbit, Comment } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

type CommentWithProfile = Comment & { profiles: Profile };

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    async function load() {
      const [p, c, likedStatus] = await Promise.all([
        getPost(id),
        getComments(id),
        hasLiked(id),
      ]);
      if (p) {
        setPost(p as PostWithRelations);
        setLikeCount(p.like_count);
      }
      setComments(c as CommentWithProfile[]);
      setLiked(likedStatus);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    const result = await toggleLike(id);
    if (result.liked === prev) {
      setLiked(prev);
      setLikeCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const c = await createComment(id, commentText.trim());
    if (c) setComments((prev) => [...prev, c as CommentWithProfile]);
    setCommentText("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-4 w-20 bg-border-subtle rounded" />
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-5 space-y-3">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-border-subtle" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 bg-border-subtle rounded" />
              <div className="h-2.5 w-20 bg-border-subtle rounded" />
            </div>
          </div>
          <div className="h-4 w-full bg-border-subtle rounded" />
          <div className="h-4 w-3/4 bg-border-subtle rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Post not found</h2>
        <Link href="/feed" className="text-brand-400 hover:underline text-sm">Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      <Card padding="lg" className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <Link href={`/profile/${post.author_id}`} className="flex items-center gap-3">
            <Avatar
              name={post.profiles?.display_name || post.profiles?.username || "U"}
              size="md"
              src={post.profiles?.avatar_url}
            />
            <div>
              <p className="font-semibold text-text-primary text-sm">
                {post.profiles?.display_name || post.profiles?.username || "Unknown"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span>@{post.profiles?.username || "unknown"}</span>
                <span>·</span>
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </Link>
          {post.orbits && (
            <Link
              href={`/orbit/${post.orbits.slug}`}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-400 hover:bg-brand-400/20 transition-colors"
            >
              {post.orbits.name}
            </Link>
          )}
        </div>

        <p className="text-text-primary mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${
            post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}>
            {post.media_urls.slice(0, 4).map((url, i) => (
              <div key={i} className="relative bg-surface-raised aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 pt-3 border-t border-border-subtle">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? "text-red-500" : "text-text-muted hover:text-red-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-400 transition-colors">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button className="flex items-center gap-1.5 text-text-muted hover:text-brand-400 transition-colors ml-auto">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <div className="mb-4">
        <h3 className="font-bold text-text-primary mb-4">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <MessageCircle className="h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">
              No comments yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} padding="md" className="flex gap-3">
                <Link href={`/profile/${comment.author_id}`}>
                  <Avatar
                    name={comment.profiles?.display_name || comment.profiles?.username || "U"}
                    size="sm"
                    src={comment.profiles?.avatar_url}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/profile/${comment.author_id}`}
                      className="text-sm font-semibold text-text-primary hover:underline"
                    >
                      {comment.profiles?.display_name || comment.profiles?.username || "Unknown"}
                    </Link>
                    <span className="text-xs text-text-muted">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{comment.content}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleComment} className="flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-xl bg-surface-raised border border-border-subtle px-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Send className="h-4 w-4" />}
            loading={submitting}
            disabled={!commentText.trim()}
          >
            Post
          </Button>
        </div>
      </form>
    </div>
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
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
