"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { useUser } from "@/components/providers/UserProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Monitor,
  Plus,
} from "lucide-react";
import { getUnreadCount, subscribeToNotifications } from "@/lib/supabase/queries";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const { theme, setTheme } = useTheme();
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUnreadCount().then(setUnread);
    let sub: { unsubscribe: () => void } | null = null;
    (async () => {
      sub = await subscribeToNotifications(() => {
        setUnread((c) => c + 1);
      });
    })();
    return () => sub?.unsubscribe();
  }, []);

  const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  if (pathname.startsWith("/chat")) return null;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-lg font-bold text-text-primary hidden sm:block">
            Orbiting
          </span>
        </Link>

        {/* Search Bar (center) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Search orbits, people, posts..."
              className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search (mobile) */}
          <Link
            href="/search"
            className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Create */}
          <Link
            href="/create-orbit"
            className="p-2 rounded-xl text-text-secondary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className={cn(
              "relative p-2 rounded-xl transition-colors",
              pathname === "/notifications"
                ? "text-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20"
            )}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(nextTheme)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          {/* Profile */}
          <Link href="/profile/me" className="ml-1">
            <Avatar
              name={profile?.display_name || profile?.username || "User"}
              size="sm"
              src={profile?.avatar_url}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
