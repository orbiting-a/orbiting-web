"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Textarea, Button } from "@/components/ui";
import { Calendar, MapPin, Orbit as OrbitIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyChannels } from "@/lib/supabase/queries";
import type { Channel } from "@/types/database";

export default function CreateActivityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [orbitId, setOrbitId] = useState("");
  const [orbits, setOrbits] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrbits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("orbit_members")
        .select("orbits(id, name)")
        .eq("user_id", user.id);
      if (data) {
        setOrbits(data.map((d: unknown) => (d as { orbits: { id: string; name: string } }).orbits));
      }
    }
    loadOrbits();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbitId) { setError("Please select an orbit"); return; }
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setSubmitting(false); return; }

    const { error: err } = await supabase.from("events").insert({
      orbit_id: orbitId,
      title: title.trim(),
      description: desc.trim() || null,
      location: location.trim() ? { city: location.trim(), lat: 0, lng: 0, country: "" } : null,
      starts_at: new Date(date).toISOString(),
      created_by: user.id,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Create Activity</h1>
        <p className="text-sm text-text-secondary">Host a meetup or event in your orbit</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Orbit</label>
            <select
              value={orbitId}
              onChange={(e) => setOrbitId(e.target.value)}
              className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">Select an orbit...</option>
              {orbits.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Activity Title"
            placeholder="e.g. Saturday Pizza Party Meetup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="What will we do? Bring anything?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
          />

          <Input
            label="Date & Time"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            icon={<Calendar className="h-4 w-4" />}
            required
          />

          <Input
            label="Location"
            placeholder="e.g. Campus Central Park"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={<MapPin className="h-4 w-4" />}
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" loading={submitting}>
              Create Event
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
