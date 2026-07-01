"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { LocationSearch, LocationResult } from "@/components/ui/LocationSearch";
import { ArrowLeft, Calendar, MapPin, AlignLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { getOrbitBySlug, createEvent } from "@/lib/supabase/queries";
import { toast } from "sonner";

export default function CreateEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [orbit, setOrbit] = useState<any>(null);
  const [loadingOrbit, setLoadingOrbit] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    getOrbitBySlug(slug)
      .then((data) => {
        setOrbit(data);
        setLoadingOrbit(false);
      })
      .catch((err) => {
        toast.error("Failed to load orbit info");
        setLoadingOrbit(false);
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbit) return;
    if (!title.trim()) { toast.error("Event title is required"); return; }
    if (!startsAt) { toast.error("Start date and time is required"); return; }
    if (!location) { toast.error("Location is required"); return; }

    setSubmitting(true);
    try {
      await createEvent({
        orbit_id: orbit.id,
        title,
        description,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        location,
        cover_url: coverUrl.trim() || null,
      });

      toast.success("Event created successfully!");
      router.push(`/orbit/${orbit.slug}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrbit) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!orbit) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Orbit not found</h2>
        <Link href="/discover">
          <Button variant="primary">Go back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link
        href={`/orbit/${orbit.slug}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {orbit.name}
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Create New Event</h1>
      <p className="text-sm text-text-muted mb-6">Schedule an upcoming activity or meetup for {orbit.name}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card padding="lg" className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
              Event Title *
            </label>
            <Input
              type="text"
              placeholder="e.g. Weekly Meetup, Hackathon..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <Textarea
              placeholder="Provide details about the event, agenda, and guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
                Starts At *
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
                Ends At (Optional)
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
              Location *
            </label>
            <LocationSearch
              value={location}
              onChange={setLocation}
              placeholder="Search or choose on map..."
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5 block">
              Cover Image URL (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </div>

        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href={`/orbit/${orbit.slug}`} className="flex-1 sm:flex-none">
            <Button type="button" variant="secondary" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            className="flex-1 sm:flex-none px-8"
          >
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}
