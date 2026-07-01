"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ONLINE_CHANNEL = "orbit-presence";

const PresenceContext = createContext<Set<string>>(new Set());

export function useOnlineStatus(userId: string | undefined, targetUserId: string | undefined): boolean {
  const onlineUsers = useContext(PresenceContext);
  if (!targetUserId || !userId || userId === targetUserId) return false;
  return onlineUsers.has(targetUserId);
}

export function PresenceProviderInner({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    let destroyed = false;

    import("@/lib/auth").then(({ getCurrentUser }) =>
      getCurrentUser().then((user) => {
        if (destroyed || !user) return;
        userIdRef.current = user.id;

        const supabase = createClient();
        const channel = supabase.channel(ONLINE_CHANNEL);

        channel.on("presence", { event: "sync" }, () => {
          if (destroyed) return;
          const state = channel.presenceState();
          setOnlineUsers(new Set(Object.keys(state)));
        });

        channel.on("presence", { event: "join" }, ({ key }) => {
          if (!destroyed) setOnlineUsers((prev) => new Set(prev).add(key));
        });

        channel.on("presence", { event: "leave" }, ({ key }) => {
          if (!destroyed) {
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }
        });

        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !destroyed) {
            await channel.track({ user_id: user.id, online_at: Date.now() });
          }
        });

        const interval = setInterval(() => {
          if (!destroyed) channel.track({ user_id: user.id, online_at: Date.now() }).catch(() => {});
        }, 30000);

        cleanupRef.current = () => {
          clearInterval(interval);
          channel.unsubscribe();
        };
      })
    );

    return () => {
      destroyed = true;
      cleanupRef.current?.();
    };
  }, []);

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  );
}
