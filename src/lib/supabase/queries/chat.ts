import { createClient } from "../client";
import type { Channel, Message, Profile } from "@/types/database";

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
  const { data } = await supabase.from("channels").select("*").eq("id", id).single();
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

  const { data: channel } = await supabase
    .from("channels")
    .insert({ type: "dm", created_by: user.id })
    .select()
    .single();

  if (!channel) throw new Error("Failed to create channel");

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

export async function getMessages(channelId: string, limit = 50) {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(*)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).reverse() as (Message & { profiles: Profile })[];
}

export async function sendMessage(channelId: string, content: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("messages")
    .insert({ channel_id: channelId, sender_id: user.id, content })
    .select("*, profiles!messages_sender_id_fkey(*)")
    .single();
  return data as (Message & { profiles: Profile }) | null;
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
        supabase
          .from("messages")
          .select("*, profiles!messages_sender_id_fkey(*)")
          .eq("id", (payload.new as { id: string }).id)
          .single()
          .then(({ data }) => {
            if (data) onMessage(data as Message & { profiles: Profile });
          });
      }
    )
    .subscribe();
  return { channel, unsubscribe: () => channel.unsubscribe() };
}
