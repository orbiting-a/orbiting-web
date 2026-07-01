"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  LayoutDashboard,
  Users,
  Globe,
  Shield,
  Database,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orbits", label: "Orbits", icon: Globe },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
  { href: "/admin/data", label: "Data", icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const user = await getCurrentUser();
      if (!user || !isAdmin(user.id)) {
        router.push("/feed");
        return;
      }
      setAuthorized(true);
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <aside className="w-56 shrink-0 border-r border-border h-screen sticky top-0 overflow-y-auto bg-surface-raised">
          <div className="p-4 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">O</span>
              </div>
              <span className="text-sm font-bold text-text-primary">Admin</span>
            </Link>
          </div>
          <nav className="p-3 space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-brand-500 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border mt-auto">
            <Link
              href="/feed"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-h-screen p-6">{children}</main>
      </div>
    </div>
  );
}
