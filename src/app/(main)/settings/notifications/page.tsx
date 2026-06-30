"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { ArrowLeft, Bell, Heart, MessageCircle, Users, AtSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const notificationOptions = [
  { id: "likes", label: "Likes", description: "When someone likes your post", icon: Heart },
  { id: "comments", label: "Comments", description: "When someone comments on your post", icon: MessageCircle },
  { id: "follows", label: "Follows", description: "When someone follows you", icon: Users },
  { id: "mentions", label: "Mentions", description: "When someone mentions you", icon: AtSign },
  { id: "orbit_updates", label: "Orbit Updates", description: "Activity in your orbits", icon: Bell },
];

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    orbit_updates: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("notification_preferences", JSON.stringify(enabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        <Button variant="primary" size="sm" onClick={handleSave} icon={saved ? <CheckCircle2 className="h-4 w-4" /> : undefined}>
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="space-y-2">
        {notificationOptions.map((opt) => (
          <Card key={opt.id} padding="md" className="flex items-center gap-3">
            <opt.icon className="h-5 w-5 text-text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{opt.label}</p>
              <p className="text-xs text-text-muted">{opt.description}</p>
            </div>
            <button
              onClick={() => toggle(opt.id)}
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                enabled[opt.id] ? "bg-brand-500" : "bg-border-subtle"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                enabled[opt.id] ? "translate-x-5" : ""
              }`} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
