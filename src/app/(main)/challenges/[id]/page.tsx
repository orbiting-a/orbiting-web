"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { Trophy, Calendar, Users, ArrowLeft, Image, Video, MapPin } from "lucide-react";
import Link from "next/link";
import { getChallenge } from "@/lib/supabase/queries";
import type { Challenge, Profile } from "@/types/database";

const typeIcons = { photo: Image, video: Video, text: Trophy, location: MapPin };

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<(Challenge & { profiles: Profile }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenge(id).then((c) => {
      setChallenge(c as (Challenge & { profiles: Profile }) | null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-border-subtle rounded" />
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-6 space-y-3">
          <div className="h-4 w-full bg-border-subtle rounded" />
          <div className="h-4 w-3/4 bg-border-subtle rounded" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Challenge not found</h2>
        <Link href="/feed" className="text-brand-400 hover:underline text-sm">Back to Feed</Link>
      </div>
    );
  }

  const Icon = typeIcons[challenge.type] || Trophy;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Feed
      </Link>

      <Card padding="lg">
        {challenge.cover_url && (
          <div className="h-40 -mx-6 -mt-6 mb-6 overflow-hidden">
            <img src={challenge.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-brand-400/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{challenge.title}</h1>
            <p className="text-xs text-text-muted capitalize">{challenge.type} challenge</p>
          </div>
        </div>

        {challenge.description && (
          <p className="text-text-secondary text-sm leading-relaxed mb-6">{challenge.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {new Date(challenge.starts_at).toLocaleDateString()}
          </span>
          {challenge.ends_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Ends {new Date(challenge.ends_at).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {challenge.participant_count} participants
          </span>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
          <Avatar name={challenge.profiles?.display_name || "U"} size="sm" src={challenge.profiles?.avatar_url} />
          <span className="text-sm text-text-muted">
            Created by {challenge.profiles?.display_name || challenge.profiles?.username}
          </span>
        </div>
      </Card>
    </div>
  );
}
