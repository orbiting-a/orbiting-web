import { create } from "zustand";
import { getUnreadCounts, markChannelRead } from "@/lib/supabase/queries";

interface ChatState {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  fetching: boolean;
  fetchUnread: () => Promise<void>;
  markRead: (channelId: string) => Promise<void>;
  incrementUnread: (channelId: string) => void;
  setUnreadCount: (channelId: string, count: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  unreadCounts: {},
  totalUnread: 0,
  fetching: false,

  fetchUnread: async () => {
    if (get().fetching) return;
    set({ fetching: true });
    try {
      const counts = await getUnreadCounts();
      const map: Record<string, number> = {};
      let total = 0;
      counts.forEach((c) => {
        map[c.channel_id] = c.count;
        total += c.count;
      });
      set({ unreadCounts: map, totalUnread: total });
    } catch (e) {
      console.error("Error fetching unread counts:", e);
    } finally {
      set({ fetching: false });
    }
  },

  markRead: async (channelId: string) => {
    // Optimistic update
    const currentCounts = { ...get().unreadCounts };
    const currentUnread = currentCounts[channelId] || 0;
    if (currentUnread === 0) return;

    delete currentCounts[channelId];
    set({
      unreadCounts: currentCounts,
      totalUnread: Math.max(0, get().totalUnread - currentUnread),
    });

    try {
      await markChannelRead(channelId);
    } catch (e) {
      console.error(`Error marking channel ${channelId} read:`, e);
      // Rollback on failure
      set((state) => {
        const rollbackCounts = { ...state.unreadCounts, [channelId]: currentUnread };
        return {
          unreadCounts: rollbackCounts,
          totalUnread: state.totalUnread + currentUnread,
        };
      });
    }
  },

  incrementUnread: (channelId: string) => {
    set((state) => {
      const counts = { ...state.unreadCounts };
      const current = counts[channelId] || 0;
      counts[channelId] = current + 1;
      return {
        unreadCounts: counts,
        totalUnread: state.totalUnread + 1,
      };
    });
  },

  setUnreadCount: (channelId: string, count: number) => {
    set((state) => {
      const counts = { ...state.unreadCounts };
      const current = counts[channelId] || 0;
      counts[channelId] = count;
      return {
        unreadCounts: counts,
        totalUnread: state.totalUnread - current + count,
      };
    });
  },
}));
