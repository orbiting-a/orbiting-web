"use client";

import { useState } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import { Users, MapPin, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { joinOrbit, leaveOrbit } from "@/lib/supabase/queries";
import type { Orbit } from "@/types/database";

export function OrbitCard({
  orbit,
  isMember: initialMember = false,
}: {
  orbit: Orbit;
  isMember?: boolean;
}) {
  const [isMember, setIsMember] = useState(initialMember);
  const [memberCount, setMemberCount] = useState(orbit.member_count);

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMember) {
      await leaveOrbit(orbit.id);
      setIsMember(false);
      setMemberCount((c) => c - 1);
    } else {
      await joinOrbit(orbit.id);
      setIsMember(true);
      setMemberCount((c) => c + 1);
    }
  };

  return (
    <Link href={`/orbit/${orbit.slug}`}>
      <Card hover padding="md" className="h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={orbit.name} size="md" src={orbit.logo_url} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary truncate">
              {orbit.name}
            </h3>
            <p className="text-xs text-text-muted truncate">
              {orbit.is_private ? (
                <Lock className="inline h-3 w-3 mr-0.5" />
              ) : (
                <Globe className="inline h-3 w-3 mr-0.5" />
              )}
              {orbit.is_private ? "Private" : "Public"} orbit
            </p>
          </div>
        </div>

        {orbit.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3 flex-1">
            {orbit.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount}
            </span>
            {orbit.category && (
              <span className="px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-400 text-[10px] font-medium">
                {orbit.category}
              </span>
            )}
          </div>
          <Button
            variant={isMember ? "secondary" : "primary"}
            size="sm"
            onClick={handleJoin}
          >
            {isMember ? "Joined" : "Join"}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
