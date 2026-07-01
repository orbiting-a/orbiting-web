"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button } from "@/components/ui";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getEvent, rsvpEvent, cancelRsvpEvent, hasRsvpd, getEventAttendees } from "@/lib/supabase/queries";
import type { OrbitEvent, Profile, Orbit } from "@/types/database";

type EventWithRelations = OrbitEvent & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventWithRelations | null>(null);
  const [rsvpd, setRsvpd] = useState(false);
  const [attendees, setAttendees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      const [e, r, atts] = await Promise.all([
        getEvent(id),
        hasRsvpd(id),
        getEventAttendees(id),
      ]);
      setEvent(e as EventWithRelations | null);
      setRsvpd(r);
      setAttendees(atts);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleRsvp = async () => {
    setToggling(true);
    try {
      if (rsvpd) {
        const result = await cancelRsvpEvent(id);
        setRsvpd(result.rsvpd);
        if (event) {
          setEvent({ ...event, attendee_count: Math.max(0, event.attendee_count - 1) });
        }
      } else {
        const result = await rsvpEvent(id);
        setRsvpd(result.rsvpd);
        if (event) {
          setEvent({ ...event, attendee_count: event.attendee_count + 1 });
        }
      }
      // Reload attendees list
      const atts = await getEventAttendees(id);
      setAttendees(atts);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
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
  const eventLoc = event.location as { lat: number; lng: number; displayName: string; city: string; country: string } | null;

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
          <div className="h-40 -mx-6 -mt-6 mb-6 overflow-hidden relative">
            <Image src={event.cover_url} alt="" fill className="object-cover" />
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
            <Calendar className="h-4 w-4 text-brand-400 shrink-0" />
            <span>
              {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Clock className="h-4 w-4 text-brand-400 shrink-0" />
            <span>
              {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {endDate ? ` — ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          </div>
          {eventLoc && (
            <div className="flex items-start gap-3 text-sm text-text-secondary">
              <MapPin className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{eventLoc.displayName}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Users className="h-4 w-4 text-brand-400 shrink-0" />
            <span>{event.attendee_count} attending</span>
          </div>
        </div>

        {event.description && (
          <p className="text-text-primary leading-relaxed mb-6 whitespace-pre-wrap">{event.description}</p>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Avatar name={event.profiles?.display_name || event.profiles?.username || "U"} size="sm" src={event.profiles?.avatar_url} />
            <span className="truncate max-w-[150px]">Hosted by {event.profiles?.display_name || event.profiles?.username}</span>
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

      {/* Attendees list */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-400" />
          Attendees ({attendees.length})
        </h3>
        {attendees.length === 0 ? (
          <Card padding="md" className="text-center text-text-muted text-sm py-8">
            No attendees yet. Be the first to RSVP!
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attendees.map((att) => (
              <Link key={att.id} href={`/profile/${att.id}`}>
                <Card hover padding="sm" className="flex items-center gap-2.5">
                  <Avatar name={att.display_name || att.username || "U"} size="xs" src={att.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {att.display_name || att.username}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">
                      @{att.username}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
