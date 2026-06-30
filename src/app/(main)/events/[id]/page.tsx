"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getEvent, rsvpEvent, hasRsvpd } from "@/lib/supabase/queries";
import type { OrbitEvent, Profile, Orbit } from "@/types/database";

type EventWithRelations = OrbitEvent & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventWithRelations | null>(null);
  const [rsvpd, setRsvpd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      const [e, r] = await Promise.all([getEvent(id), hasRsvpd(id)]);
      setEvent(e as EventWithRelations | null);
      setRsvpd(r);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleRsvp = async () => {
    setToggling(true);
    const result = await rsvpEvent(id);
    setRsvpd(result.rsvpd);
    if (event) {
      setEvent({ ...event, attendee_count: event.attendee_count + (result.rsvpd ? 1 : -1) });
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-border-subtle rounded" />
          <div className="h-4 w-32 bg-border-subtle rounded" />
          <div className="h-4 w-full bg-border-subtle rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Event not found</h2>
        <Link href="/feed" className="text-brand-400 hover:underline text-sm">Back to Feed</Link>
      </div>
    );
  }

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href={event.orbits ? `/orbit/${event.orbits.slug}` : "/feed"}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {event.orbits ? `Back to ${event.orbits.name}` : "Back to Feed"}
      </Link>

      <Card padding="lg">
        {event.cover_url && (
          <div className="h-40 -mx-6 -mt-6 mb-6 overflow-hidden">
            <Image src={event.cover_url} alt="" width={800} height={160} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">{event.title}</h1>
            {event.orbits && (
              <Link href={`/orbit/${event.orbits.slug}`} className="text-sm text-brand-400 hover:underline">
                {event.orbits.name}
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Calendar className="h-4 w-4 text-brand-400" />
            <span>
              {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Clock className="h-4 w-4 text-brand-400" />
            <span>
              {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {endDate ? ` — ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Users className="h-4 w-4 text-brand-400" />
            <span>{event.attendee_count} attending</span>
          </div>
        </div>

        {event.description && (
          <p className="text-text-primary leading-relaxed mb-6 whitespace-pre-wrap">{event.description}</p>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Avatar name={event.profiles?.display_name || event.profiles?.username || "U"} size="sm" src={event.profiles?.avatar_url} />
            <span>Hosted by {event.profiles?.display_name || event.profiles?.username}</span>
          </div>
          <Button
            variant={rsvpd ? "secondary" : "primary"}
            size="sm"
            className="ml-auto"
            onClick={handleRsvp}
            loading={toggling}
            icon={rsvpd ? <CheckCircle className="h-4 w-4" /> : undefined}
          >
            {rsvpd ? "Attending" : "RSVP"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
