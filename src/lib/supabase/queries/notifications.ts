import { createClient } from "../client";
import type { Notification } from "@/types/database";

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
