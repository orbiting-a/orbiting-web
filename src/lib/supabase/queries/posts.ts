import { createClient } from "../client";
import type { Post, Profile, Orbit, Story, Comment } from "@/types/database";

async function getFeedPostsRaw(options?: {
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("orbit_members")
    .select("orbit_id")
    .eq("user_id", user.id);

  const orbitIds = memberships?.map((m) => m.orbit_id) ?? [];
  const { data: publicOrbits } = await supabase
    .from("orbits")
    .select("id")
    .eq("is_private", false);

  const publicIds = publicOrbits?.map((o) => o.id) ?? [];
  const allIds = [...new Set([...orbitIds, ...publicIds])];

  if (allIds.length === 0) return [];

  const { data } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
    .in("orbit_id", allIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> })[];
}

export async function getScoredFeedPosts(options?: {
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data } = await supabase.rpc("get_scored_feed", {
      p_user_id: user.id,
      p_limit: options?.limit ?? 10,
      p_offset: options?.offset ?? 0,
    });
    if (!data) return [];
    // Fetch full post data with relations for the scored IDs
    const ids = (data as { id: string }[]).map((d) => d.id);
    if (ids.length === 0) return [];
    const { data: posts } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
      .in("id", ids)
      .order("created_at", { ascending: false });
    return (posts ?? []) as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> })[];
  } catch {
    // Fall back to simple feed if scoring function doesn't exist
    return getFeedPostsRaw(options);
  }
}

export const getFeedPosts = getScoredFeedPosts;

export async function getOrbitPosts(orbitId: string, options?: { limit?: number; offset?: number }) {
  const supabase = createClient();
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { data } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
    .eq("orbit_id", orbitId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> })[];
}

export async function getReels(options?: { limit?: number; offset?: number }) {
  const supabase = createClient();
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { data } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
    .eq("media_type", "reel")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> })[];
}

export async function getStories() {
  const supabase = createClient();
  const { data } = await supabase
    .from("stories")
    .select("*, profiles!stories_user_id_fkey(*)")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return (data ?? []) as Story[];
}

export async function createStory(mediaUrl: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("stories")
    .insert({ user_id: user.id, media_url: mediaUrl, expires_at: expiresAt })
    .select()
    .single();
  return data as Story | null;
}

export async function getPost(postId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
    .eq("id", postId)
    .single();
  return data as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> }) | null;
}

export async function createPost(post: {
  orbit_id: string;
  content?: string;
  media_urls?: string[];
  media_type?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("posts")
    .insert({ ...post, author_id: user.id })
    .select()
    .single();
  return data as Post | null;
}

export async function deletePost(postId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return !error;
}

export async function getUserPosts(userId: string, options?: { limit?: number; offset?: number }) {
  const supabase = createClient();
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { data } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(*), orbits!posts_orbit_id_fkey(name, slug, logo_url)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as (Post & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> })[];
}

// ===== LIKES =====

export async function toggleLike(postId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { liked: false };

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return { liked: false };
  }

  await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  return { liked: true };
}

export async function hasLiked(postId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();
  return !!data;
}

// ===== COMMENTS =====

export async function getComments(postId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(*)")
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });
  return data as (Comment & { profiles: Profile })[];
}

export async function getReplies(commentId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(*)")
    .eq("parent_id", commentId)
    .order("created_at", { ascending: true });
  return data as (Comment & { profiles: Profile })[];
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, content, parent_id: parentId ?? null })
    .select("*, profiles!comments_author_id_fkey(*)")
    .single();
  return data as (Comment & { profiles: Profile }) | null;
}
