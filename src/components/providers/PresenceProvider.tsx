"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";

const ONLINE_CHANNEL = "orbit-presence";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let interval: ReturnType<typeof setInterval> | undefined;

    getCurrentUser().then((user) => {
      if (!user || trackedRef.current) return;
      trackedRef.current = true;

      const supabase = createClient();
      channel = supabase.channel(ONLINE_CHANNEL);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel!.track({ user_id: user.id, online_at: Date.now() });
        }
      });

      interval = setInterval(() => {
        channel?.track({ user_id: user.id, online_at: Date.now() }).catch(() => {});
      }, 30000);
    });

    return () => {
      clearInterval(interval);
      channel?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
