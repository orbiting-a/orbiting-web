"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Avatar, Button } from "@/components/ui";
import {
  User,
  Bell,
  Shield,
  Lock,
  Globe,
  Ban,
  LogOut,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { signOut, getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/supabase/queries";
import type { Profile } from "@/types/database";

const settingsSections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Personal Information", href: "/settings/profile" },
      { icon: Lock, label: "Change Password", href: "/settings/password" },
      { icon: Shield, label: "Privacy & Security", href: "/settings/privacy" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", href: "/settings/notifications" },
      { icon: Globe, label: "Language", href: "/settings/language" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: Ban, label: "Blocked Users", href: "/settings/blocked" },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) getProfile(user.id).then(setProfile);
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      <Link href="/settings/profile">
        <Card padding="lg" className="mb-6 cursor-pointer hover:bg-surface-raised transition-colors">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile?.display_name || profile?.username || "User"}
              size="lg"
              src={profile?.avatar_url}
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-text-primary truncate">
                {profile?.display_name || profile?.username || "Your Name"}
              </h2>
              <p className="text-sm text-text-muted">@{profile?.username || "username"}</p>
            </div>
            <Button variant="secondary" size="sm">Edit</Button>
          </div>
        </Card>
      </Link>

      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 mb-2">
              {section.title}
            </h3>
            <div className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden">
              {section.items.map((item, idx) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors ${
                    idx < section.items.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <item.icon className="h-5 w-5 text-text-muted shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Button
          variant="danger"
          size="md"
          icon={<LogOut className="h-4 w-4" />}
          className="w-full"
          loading={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            await signOut();
            router.push("/login");
          }}
        >
          Log Out
        </Button>
        <Link href="/settings/privacy">
          <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-red-400" />} className="w-full text-red-400 hover:text-red-300">
            Delete Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
