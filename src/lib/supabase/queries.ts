import { createClient } from "./client";
import type { Profile, Orbit, Post, Comment, Like, Follow, Channel, Message, Notification, OrbitEvent, Challenge, TreasureHunt, Riddle, TreasureHuntParticipant, OrbitMember, OrbitRole, Story } from "@/types/database";

// ===== PROFILES =====

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data as Profile | null;
}



export async function getProfileByUsername(username: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "bio" | "avatar_url" | "username" | "location">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

export async function searchProfiles(query: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);
  return data as Profile[];
}

export async function checkUsername(username: string, excludeUserId?: string) {
  const supabase = createClient();
  let q = supabase.from("profiles").select("id").eq("username", username);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q.maybeSingle();
  return !data; // true = available, false = taken
}

// ===== ORBITS =====

export async function getOrbits(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  let q = supabase
    .from("orbits")
    .select("*")
    .eq("is_private", false)
    .order("member_count", { ascending: false })
    .limit(options?.limit ?? 20)
    .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 20) - 1);

  if (options?.category) {
    q = q.eq("category", options.category);
  }

  const { data } = await q;
  return data as Orbit[];
}

export async function getOrbitBySlug(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbits")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Orbit | null;
}

export async function createOrbit(orbit: {
  name: string;
  slug: string;
  description?: string;
  about?: string;
  category?: string;
  is_private?: boolean;
  location?: Record<string, unknown>;
  logo_url?: string;
  cover_url?: string;
  tags?: string[];
  social_links?: Record<string, string>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Find a unique slug if the base slug is taken
  let slug = orbit.slug;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: existing } = await supabase
      .from("orbits")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${orbit.slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data } = await supabase
    .from("orbits")
    .insert({ ...orbit, slug, created_by: user.id })
    .select()
    .single();

  if (data) {
    await supabase.from("orbit_members").insert({
      orbit_id: data.id,
      user_id: user.id,
      role: "owner",
    });
  }

  return data as Orbit | null;
}

export async function searchOrbits(query: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbits")
    .select("*")
    .eq("is_private", false)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(10);
  return data as Orbit[];
}

export async function getUserOrbits(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbit_members")
    .select("orbits(*)")
    .eq("user_id", userId);
  return (data?.map((d: unknown) => (d as { orbits: Orbit }).orbits) ?? null) as Orbit[] | null;
}

// ===== ORBIT MEMBERS =====

export async function getOrbitMembers(orbitId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbit_members")
    .select("profiles(*)")
    .eq("orbit_id", orbitId);
  return (data?.map((d: unknown) => (d as { profiles: unknown }).profiles) ?? null) as Profile[] | null;
}

export async function isOrbitMember(orbitId: string, userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbit_members")
    .select("id")
    .eq("orbit_id", orbitId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function joinOrbit(orbitId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("orbit_members")
    .insert({ orbit_id: orbitId, user_id: user.id });
  return !error;
}

export async function leaveOrbit(orbitId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("orbit_members")
    .delete()
    .eq("orbit_id", orbitId)
    .eq("user_id", user.id);
  return !error;
}

export async function getOrbitMembersWithRoles(orbitId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbit_members")
    .select("*, profiles!orbit_members_user_id_fkey(*)")
    .eq("orbit_id", orbitId)
    .order("role", { ascending: true });
  return (data ?? []) as (OrbitMember & { profiles: Profile })[];
}

export async function getUserOrbitRole(orbitId: string, userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbit_members")
    .select("role")
    .eq("orbit_id", orbitId)
    .eq("user_id", userId)
    .single();
  return (data?.role ?? null) as OrbitRole | null;
}

export async function requestJoinOrbit(orbitId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.rpc("request_join_orbit", {
    p_orbit_id: orbitId,
    p_user_id: user.id,
  });
  return !error;
}

export async function approveJoinRequest(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_join_request", {
    p_member_id: memberId,
  });
  return !error;
}

export async function rejectJoinRequest(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("reject_join_request", {
    p_member_id: memberId,
  });
  return !error;
}

export async function updateMemberRole(memberId: string, newRole: OrbitRole) {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_member_role", {
    p_member_id: memberId,
    p_new_role: newRole,
  });
  return !error;
}

export async function removeMember(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_member", {
    p_member_id: memberId,
  });
  return !error;
}

export async function updateOrbit(orbitId: string, updates: Partial<Pick<Orbit, "name" | "description" | "about" | "logo_url" | "cover_url" | "is_private" | "category" | "location">>) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbits")
    .update(updates)
    .eq("id", orbitId)
    .select()
    .single();
  return data as Orbit | null;
}

// ===== POSTS =====

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

// ===== FOLLOWS =====

export async function toggleFollow(targetUserId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { following: false };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return { following: false };
  }

  await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
  return { following: true };
}

export async function isFollowing(targetUserId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();
  return !!data;
}

export async function getFollowers(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("profiles!follows_follower_id_fkey(*)")
    .eq("following_id", userId);
  return (data?.map((d: unknown) => (d as { profiles: unknown }).profiles) ?? null) as Profile[] | null;
}

export async function getFollowing(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("profiles!follows_following_id_fkey(*)")
    .eq("follower_id", userId);
  return (data?.map((d: unknown) => (d as { profiles: unknown }).profiles) ?? null) as Profile[] | null;
}

// ===== CHANNELS (Chat) =====

export async function getMyChannels() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("channel_members")
    .select("channels(*)")
    .eq("user_id", user.id);

  return (data?.map((d: unknown) => (d as { channels: Channel }).channels) ?? []) as Channel[];
}

export async function getChannel(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("channels").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data as Channel | null;
}

export async function createGroupChannel(name: string, memberIds: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: channel } = await supabase
    .from("channels")
    .insert({ type: "group", name, created_by: user.id })
    .select()
    .single();

  if (!channel) throw new Error("Failed to create channel");

  const allMembers = [...new Set([user.id, ...memberIds])];
  const { error } = await supabase.from("channel_members").insert(
    allMembers.map((uid) => ({ channel_id: channel.id, user_id: uid }))
  );
  if (error) throw error;

  return channel as Channel;
}

export async function createOrbitChannel(orbitId: string, name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("channels")
    .insert({ type: "orbit_channel", orbit_id: orbitId, name, created_by: user.id })
    .select()
    .single();

  return data as Channel | null;
}

export async function createDMChannel(targetUserId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if DM already exists
  const { data: existing } = await supabase.rpc("find_dm_channel", {
    user1_id: user.id,
    user2_id: targetUserId,
  });
  if (existing) return existing as Channel;

  // Create channel
  const { data: created } = await supabase
    .from("channels")
    .insert({ type: "dm", created_by: user.id })
    .select()
    .single();

  let channel = created as Channel | null;

  // If .select() returned null (RLS), fetch it by created_by as fallback
  if (!channel) {
    const { data: fallback } = await supabase
      .from("channels")
      .select("*")
      .eq("created_by", user.id)
      .eq("type", "dm")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    channel = fallback as Channel | null;
  }

  if (!channel?.id) throw new Error("Failed to create channel");

  // Insert members
  const { error: memberError } = await supabase.from("channel_members").insert([
    { channel_id: channel.id, user_id: user.id },
    { channel_id: channel.id, user_id: targetUserId },
  ]);
  if (memberError) throw memberError;

  return channel as Channel;
}

export async function getChannelMembers(channelId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("channel_members")
    .select("profiles(*)")
    .eq("channel_id", channelId);
  return (data?.map((d: unknown) => (d as { profiles: unknown }).profiles) ?? []) as Profile[];
}

// ===== MESSAGES (Real-time) =====

export async function getMessages(channelId: string, limit = 50) {
  const supabase = createClient();
  if (!channelId || channelId === "undefined") return [];
  const { data } = await supabase
    .from("messages")
    .select("*, profiles!sender_id(*)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).reverse() as (Message & { profiles: Profile })[];
}

export async function sendMessage(channelId: string, content: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!channelId || channelId === "undefined") throw new Error("Invalid channel");

  const { data } = await supabase
    .from("messages")
    .insert({ channel_id: channelId, sender_id: user.id, content })
    .select()
    .single();

  if (!data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.sender_id)
    .single();

  return { ...data, profiles: profile } as Message & { profiles: Profile };
}

export function subscribeToMessages(
  channelId: string,
  onMessage: (message: Message & { profiles: Profile }) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`messages:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const msgId = (payload.new as { id: string }).id;
        supabase
          .from("messages")
          .select("*, profiles!sender_id(*)")
          .eq("id", msgId)
          .single()
          .then(({ data }) => {
            if (data) onMessage(data as Message & { profiles: Profile });
          });
      }
    )
    .subscribe();
  return { channel, unsubscribe: () => channel.unsubscribe() };
}

// ===== NOTIFICATIONS =====

export async function getNotifications() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .is("is_read", false);
}

export async function getUnreadCount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("is_read", false);
  return count ?? 0;
}

export function subscribeToNotifications(
  onNotification: (n: Notification) => void
) {
  const supabase = createClient();
  const channelName = `notifications-${crypto.randomUUID()}`;
  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();
}

// ===== SEARCH =====

export async function searchAll(query: string) {
  const supabase = createClient();
  const [orbits, profiles, posts] = await Promise.all([
    supabase
      .from("orbits")
      .select("id, name, slug, logo_url, member_count, category")
      .eq("is_private", false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(5),
    supabase
      .from("posts")
      .select("id, content, created_at, author_id, profiles!posts_author_id_fkey(username, display_name)")
      .textSearch("content", query, { type: "plain" })
      .limit(5),
  ]);

  return {
    orbits: orbits.data ?? [],
    profiles: profiles.data ?? [],
    posts: posts.data ?? [],
  };
}

// ===== RADAR / NEARBY =====

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getNearbyOrbits(lat: number, lng: number, radiusKm: number) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orbits")
    .select("id, name, slug, logo_url, description, member_count, category, location, is_private")
    .not("location", "is", null)
    .eq("is_private", false)
    .limit(50);

  if (!data) return [];
  return data.filter((o) => {
    const loc = o.location as { lat?: number; lng?: number } | null;
    if (!loc?.lat || !loc?.lng) return false;
    return haversineDistance(lat, lng, loc.lat, loc.lng) <= radiusKm;
  });
}

export async function getNearbyUsers(lat: number, lng: number, radiusKm: number) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, location")
    .not("location", "is", null)
    .limit(50);

  if (!data) return [];
  return data.filter((p) => {
    const loc = p.location as { lat?: number; lng?: number } | null;
    if (!loc?.lat || !loc?.lng) return false;
    return haversineDistance(lat, lng, loc.lat, loc.lng) <= radiusKm;
  });
}

export async function getNearbyEvents(lat: number, lng: number, radiusKm: number) {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, description, cover_url, location, starts_at, orbit_id")
    .not("location", "is", null)
    .limit(50);

  if (!data) return [];
  return data.filter((e) => {
    const loc = e.location as { lat?: number; lng?: number } | null;
    if (!loc?.lat || !loc?.lng) return false;
    return haversineDistance(lat, lng, loc.lat, loc.lng) <= radiusKm;
  });
}

// ===== EVENTS =====

export async function getOrbitEvents(orbitId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*, profiles!events_created_by_fkey(*)")
    .eq("orbit_id", orbitId)
    .order("starts_at", { ascending: true });
  return (data ?? []) as (OrbitEvent & { profiles: Profile })[];
}

export async function getEvent(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*, profiles!events_created_by_fkey(*), orbits!events_orbit_id_fkey(name, slug, logo_url)")
    .eq("id", id)
    .single();
  return data as (OrbitEvent & { profiles: Profile; orbits: Pick<Orbit, "name" | "slug" | "logo_url"> }) | null;
}

export async function rsvpEvent(eventId: string) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("attendee_count").eq("id", eventId).single();
  if (!event) return { rsvpd: false };
  await supabase.from("events").update({
    attendee_count: (event.attendee_count || 0) + 1,
  }).eq("id", eventId);
  return { rsvpd: true };
}

export async function hasRsvpd(_eventId: string) {
  return false;
}

// ===== POLLS =====

export async function createPoll(postId: string, question: string, options: string[]) {
  const supabase = createClient();
  const { data } = await supabase
    .from("polls")
    .insert({
      post_id: postId,
      question,
      options: options.map((text) => ({ text, votes: 0 })),
    })
    .select()
    .single();
  return data;
}

export async function votePoll(pollId: string, optionIndex: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();
  if (existing) return { voted: false };
  await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
  // Update options JSONB
  const { data: poll } = await supabase.from("polls").select("options").eq("id", pollId).single();
  if (poll) {
    const opts = poll.options as { text: string; votes: number }[];
    opts[optionIndex].votes += 1;
    await supabase.from("polls").update({ options: opts }).eq("id", pollId);
  }
  return { voted: true };
}

export async function getPollVote(pollId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return -1;
  const { data } = await supabase
    .from("poll_votes")
    .select("option_index")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();
  return data?.option_index ?? -1;
}

export function subscribeToLocationUpdates(onUpdate: (payload: unknown) => void) {
  const supabase = createClient();
  return supabase
    .channel("radar-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "orbits" }, onUpdate)
    .subscribe();
}

// ===== CHALLENGES =====

export async function getOrbitChallenges(orbitId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, profiles!challenges_created_by_fkey(*)")
    .eq("orbit_id", orbitId)
    .order("created_at", { ascending: false });
  return (data ?? []) as (Challenge & { profiles: Profile })[];
}

export async function getChallenge(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, profiles!challenges_created_by_fkey(*)")
    .eq("id", id)
    .single();
  return data as (Challenge & { profiles: Profile }) | null;
}

export async function createChallenge(challenge: {
  orbit_id: string;
  title: string;
  description?: string;
  type?: string;
  cover_url?: string;
  ends_at?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("challenges")
    .insert({ ...challenge, created_by: user.id })
    .select()
    .single();
  return data as Challenge | null;
}

// ===== TREASURE HUNTS =====

export async function getTreasureHunts() {
  const supabase = createClient();
  const { data } = await supabase
    .from("treasure_hunts")
    .select("*, profiles!treasure_hunts_created_by_fkey(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as (TreasureHunt & { profiles: Profile })[];
}

export async function getTreasureHunt(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("treasure_hunts")
    .select("*, profiles!treasure_hunts_created_by_fkey(*)")
    .eq("id", id)
    .single();
  return data as (TreasureHunt & { profiles: Profile }) | null;
}

export async function getRiddles(huntId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("riddles")
    .select("*")
    .eq("treasure_hunt_id", huntId)
    .order("level", { ascending: true });
  return data as Riddle[];
}

export async function startTreasureHunt(huntId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("treasure_hunt_participants")
    .upsert({ treasure_hunt_id: huntId, user_id: user.id, current_level: 1, score: 0 })
    .select()
    .single();
  return data as TreasureHuntParticipant | null;
}

export async function getMyProgress(huntId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("treasure_hunt_participants")
    .select("*")
    .eq("treasure_hunt_id", huntId)
    .eq("user_id", user.id)
    .single();
  return data as TreasureHuntParticipant | null;
}

export async function submitRiddleAnswer(riddleId: string, answer: string) {
  const supabase = createClient();
  const { data: riddle } = await supabase.from("riddles").select("*").eq("id", riddleId).single();
  if (!riddle) return { correct: false };
  const isCorrect = riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim();
  if (isCorrect) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc("advance_treasure_hunt_level", {
        p_user_id: user.id,
        p_hunt_id: riddle.treasure_hunt_id,
        p_score: riddle.max_score,
      });
    }
  }
  return { correct: isCorrect };
}

export async function getTreasureHuntLeaderboard(huntId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("treasure_hunt_participants")
    .select("*, profiles!treasure_hunt_participants_user_id_fkey(*)")
    .eq("treasure_hunt_id", huntId)
    .order("score", { ascending: false })
    .limit(20);
  return (data ?? []) as (TreasureHuntParticipant & { profiles: Profile })[];
}

// ===== STORAGE =====

export async function uploadToBucket(file: File, path: string): Promise<string> {
  const { initR2, isR2Configured, uploadToR2 } = await import("@/lib/storage");
  initR2();
  if (isR2Configured()) {
    const url = await uploadToR2(file, path);
    if (url) return url;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("orbit-media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
  if (error || !data) throw new Error(error?.message || "Upload failed");
  const { data: url } = supabase.storage.from("orbit-media").getPublicUrl(data.path);
  return url.publicUrl;
}

export async function uploadMedia(file: File, path: string) {
  const { compressImage, compressToThumbnail, thumbnailPath } = await import("@/lib/compress-image");
  const [compressed, thumbFile] = await Promise.all([
    compressImage(file),
    compressToThumbnail(file),
  ]);
  const fullUrl = await uploadToBucket(compressed, path);
  await uploadToBucket(thumbFile, thumbnailPath(path)).catch(() => {});
  return fullUrl;
}
