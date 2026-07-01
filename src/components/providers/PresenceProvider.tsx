"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    getCurrentUser().then((user) => {
      if (!user || trackedRef.current) return;
      trackedRef.current = true;

      const supabase = createClient();
      channel = supabase.channel(`presence:${user.id}`, {
        config: { presence: { key: user.id } },
      });
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel!.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    });

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
