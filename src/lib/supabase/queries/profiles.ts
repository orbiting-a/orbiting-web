import { createClient } from "../client";
import type { Profile } from "@/types/database";

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
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
