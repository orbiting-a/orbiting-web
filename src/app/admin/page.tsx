"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Users, Globe, FileText, MessageCircle } from "lucide-react";

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({ users: 0, orbits: 0, posts: 0, messages: 0 });

  useEffect(() => {
    async function load() {
      const [users, orbits, posts, messages] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orbits").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        orbits: orbits.count ?? 0,
        posts: posts.count ?? 0,
        messages: messages.count ?? 0,
      });
    }
    load();
  }, [supabase]);

  const cards = [
    { label: "Users", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "Orbits", value: stats.orbits, icon: Globe, color: "text-green-400" },
    { label: "Posts", value: stats.posts, icon: FileText, color: "text-brand-400" },
    { label: "Messages", value: stats.messages, icon: MessageCircle, color: "text-purple-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} padding="lg" className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl bg-surface-raised flex items-center justify-center ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-xs text-text-muted">{card.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
