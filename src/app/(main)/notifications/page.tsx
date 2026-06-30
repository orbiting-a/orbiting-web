"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Skeleton } from "@/components/ui";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  CheckCheck,
  Orbit,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Notification } from "@/types/database";

const iconMap: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  orbit_invite: Orbit,
};

const colorMap: Record<string, string> = {
  like: "text-red-500 bg-red-500/10",
  comment: "text-brand-400 bg-brand-400/10",
  follow: "text-blue-500 bg-blue-500/10",
  orbit_invite: "text-purple-500 bg-purple-500/10",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-raised border border-border-subtle">
            <Skeleton className="h-10 w-10 !rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="font-bold text-text-primary mb-1">No notifications</h3>
          <p className="text-sm text-text-muted">
            You&apos;re all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            const color = colorMap[notif.type] || "text-text-muted bg-surface-raised";

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl transition-colors",
                  notif.is_read
                    ? "bg-surface-raised border border-border-subtle"
                    : "bg-brand-500/5 border border-brand-500/20"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    color
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{notif.body}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatNotificationDate(notif.created_at)}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
