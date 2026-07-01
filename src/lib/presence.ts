"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const ONLINE_CHANNEL = "orbit-presence";

export function useOnlineStatus(userId: string | undefined, targetUserId: string | undefined): boolean {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!userId || !targetUserId || userId === targetUserId) return;

    const supabase = createClient();
    const channel = supabase.channel(ONLINE_CHANNEL);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(targetUserId in state);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: Date.now() });
        }
      });

    const interval = setInterval(() => {
      channel.track({ user_id: userId, online_at: Date.now() }).catch(() => {});
    }, 30000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [userId, targetUserId]);

  return online;
}
