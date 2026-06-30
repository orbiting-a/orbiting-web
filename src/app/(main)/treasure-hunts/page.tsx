"use client";

import { useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import Image from "next/image";
import { Map, Trophy, Users, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getTreasureHunts } from "@/lib/supabase/queries";
import type { TreasureHunt, Profile } from "@/types/database";

export default function TreasureHuntsPage() {
  const [hunts, setHunts] = useState<(TreasureHunt & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTreasureHunts().then((data) => {
      setHunts(data as (TreasureHunt & { profiles: Profile })[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Map className="h-6 w-6 text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Treasure Hunts</h1>
          <p className="text-sm text-text-muted">Solve riddles, explore locations, earn rewards</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      ) : hunts.length === 0 ? (
        <Card padding="lg" className="flex flex-col items-center py-16 text-center">
          <Trophy className="h-10 w-10 text-text-muted mb-3" />
          <h3 className="font-bold text-text-primary mb-1">No treasure hunts yet</h3>
          <p className="text-sm text-text-muted">Check back later for new adventures</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {hunts.map((hunt) => (
            <Link key={hunt.id} href={`/treasure-hunts/${hunt.id}`}>
              <Card hover padding="lg" className="flex items-start gap-4">
                {hunt.cover_url ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0">
                    <Image src={hunt.cover_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center shrink-0">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary">{hunt.name}</h3>
                  {hunt.description && (
                    <p className="text-sm text-text-muted mt-0.5 line-clamp-2">{hunt.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {hunt.participant_count}</span>
                    {hunt.creator && <span>by {hunt.profiles?.display_name || hunt.profiles?.username}</span>}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-text-muted shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
