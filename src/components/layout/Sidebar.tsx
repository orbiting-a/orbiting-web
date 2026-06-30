"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { useUser } from "@/components/providers/UserProvider";
import { Avatar } from "@/components/ui";
import {
  Home,
  Compass,
  MessageCircle,
  User,
  Settings,
  Search,
  Radar,
  Wallet,
  Shield,
  Map,
  Play,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/reels", label: "Reels", icon: Play },
  { href: "/treasure-hunts", label: "Hunts", icon: Map },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile/me", label: "Profile", icon: User },
];

const secondaryItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/search", label: "Search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();
  const isAdminUser = isAdmin(user?.id);
  const displayName = profile?.display_name || profile?.username || "User";
  const avatarUrl = profile?.avatar_url || null;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {/* User info */}
        {profile && (
          <Link
            href="/profile/me"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors mb-1"
          >
            <Avatar name={displayName} size="sm" src={avatarUrl} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
              <p className="text-xs text-text-muted truncate">@{profile.username}</p>
            </div>
          </Link>
        )}

        {/* Separator */}
        <div className="mb-2 border-t border-border-subtle" />

        {/* Primary Nav */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-3 border-t border-border-subtle" />

        {/* Bottom items */}
        <div className="flex-1" />
        <div className="space-y-0.5 border-t border-border-subtle pt-3">
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdminUser && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                pathname.startsWith("/admin")
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              )}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={async () => { await signOut(); router.push("/login"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
