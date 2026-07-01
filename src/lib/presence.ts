"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOnlineStatus(userId: string | undefined, targetUserId: string | undefined): boolean {
  const [online, setOnline] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Track own presence on own channel
    const ownChannel = supabase.channel(`presence:${userId}`, {
      config: { presence: { key: userId } },
    });
    ownChannel.subscribe((status) => {
      if (status === "SUBSCRIBED" && !trackedRef.current) {
        trackedRef.current = true;
        ownChannel.track({ user_id: userId, online_at: new Date().toISOString() });
      }
    });

    // Watch target user
    let watchChannel: ReturnType<typeof supabase.channel> | null = null;
    if (targetUserId && targetUserId !== userId) {
      watchChannel = supabase.channel(`presence:${targetUserId}`);
      watchChannel
        .on("presence", { event: "sync" }, () => {
          const state = watchChannel!.presenceState();
          setOnline(targetUserId in state);
        })
        .subscribe();
    }

    return () => {
      ownChannel.unsubscribe();
      watchChannel?.unsubscribe();
    };
  }, [userId, targetUserId]);

  return online;
}
