import * as Ably from "ably";

let client: Ably.Realtime | null = null;

export function getAblyClient() {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_ABLY_API_KEY is not set");
  client = new Ably.Realtime({ key, clientId: "orbiting-web" });
  return client;
}

let channelCache = new Map<string, Ably.RealtimeChannel>();

export function getCallChannel(callId: string) {
  const cached = channelCache.get(callId);
  if (cached) return cached;
  const ably = getAblyClient();
  const channel = ably.channels.get(`call:${callId}`, { modes: ["presence", "subscribe", "publish"] });
  channelCache.set(callId, channel);
  return channel;
}

export function clearChannelCache(callId: string) {
  channelCache.delete(callId);
}
