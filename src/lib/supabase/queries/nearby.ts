import { createClient } from "../client";

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

export function subscribeToLocationUpdates(onUpdate: (payload: unknown) => void) {
  const supabase = createClient();
  return supabase
    .channel("radar-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "orbits" }, onUpdate)
    .subscribe();
}
