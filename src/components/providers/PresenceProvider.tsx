"use client";

import { useEffect, useRef } from "react";
import { getCurrentUser } from "@/lib/auth";
import { trackPresence } from "@/lib/presence";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  const trackedRef = useRef(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user || trackedRef.current) return;
      trackedRef.current = true;
      cleanupRef.current = trackPresence(user.id);
    });

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return <>{children}</>;
}
