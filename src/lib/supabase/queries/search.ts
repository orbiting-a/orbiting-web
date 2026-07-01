import { createClient } from "../client";

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
