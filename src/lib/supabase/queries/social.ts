import { createClient } from "../client";
import type { Profile } from "@/types/database";

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
