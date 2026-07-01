import type { Channel } from "@/types/database";

let pendingChannel: Channel | null = null;

export function setPendingChannel(ch: Channel) {
  pendingChannel = ch;
}

export function takePendingChannel(): Channel | null {
  const ch = pendingChannel;
  pendingChannel = null;
  return ch;
}
