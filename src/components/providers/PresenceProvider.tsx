"use client";

import { PresenceProviderInner } from "@/lib/presence";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  return <PresenceProviderInner>{children}</PresenceProviderInner>;
}
