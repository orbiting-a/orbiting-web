CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendees are viewable by orbit members" ON event_attendees;
CREATE POLICY "Attendees are viewable by orbit members"
  ON event_attendees FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (
        EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = e.orbit_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM orbits WHERE id = e.orbit_id AND is_private = FALSE)
      )
    )
  );

DROP POLICY IF EXISTS "Users can RSVP to events" ON event_attendees;
CREATE POLICY "Users can RSVP to events"
  ON event_attendees FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (
        EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = e.orbit_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM orbits WHERE id = e.orbit_id AND is_private = FALSE)
      )
    )
  );

DROP POLICY IF EXISTS "Users can cancel RSVP" ON event_attendees;
CREATE POLICY "Users can cancel RSVP"
  ON event_attendees FOR DELETE USING (user_id = auth.uid());
