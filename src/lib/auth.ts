import { createClient } from "./supabase/client";
import { getProfile } from "./supabase/queries";
import type { Profile } from "@/types/database";

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getProfile(user.id);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
