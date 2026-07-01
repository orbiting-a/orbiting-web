import { createClient } from "../client";
import type { Orbit, OrbitMember, OrbitRole, Profile } from "@/types/database";

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
