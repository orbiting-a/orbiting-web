"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ONLINE_CHANNEL = "orbit-presence";
let sharedChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
let channelReady = false;
const readyCallbacks: (() => void)[] = [];

function getSharedChannel() {
  if (!sharedChannel) {
    const supabase = createClient();
    sharedChannel = supabase.channel(ONLINE_CHANNEL);
    sharedChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channelReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
      }
    });
  }
  return sharedChannel;
}

export function trackPresence(userId: string | undefined) {
  if (!userId) return;
  const channel = getSharedChannel();
  const doTrack = () => {
    channel.track({ user_id: userId, online_at: Date.now() }).catch(() => {});
  };
  if (channelReady) {
    doTrack();
  } else {
    readyCallbacks.push(doTrack);
  }
  const interval = setInterval(doTrack, 30000);
  return () => clearInterval(interval);
}

export function useOnlineStatus(userId: string | undefined, targetUserId: string | undefined): boolean {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!userId || !targetUserId || userId === targetUserId) return;

    const channel = getSharedChannel();

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setOnline(targetUserId in state);
    });
  }, [userId, targetUserId]);

  return online;
}
