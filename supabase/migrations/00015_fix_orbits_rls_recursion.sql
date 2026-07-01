-- Fix RLS recursion on orbits, orbit_members, posts, events, and event_attendees

-- Create security definer function to check if orbit is public without triggering RLS
CREATE OR REPLACE FUNCTION public.is_orbit_public(orbit_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM orbits WHERE id = $1 AND is_private = FALSE);
$$;

-- 1. Fix orbits policies
DROP POLICY IF EXISTS "Private orbits viewable by members" ON orbits;
CREATE POLICY "Private orbits viewable by members"
  ON orbits FOR SELECT USING (
    is_orbit_member(id, auth.uid())
  );

-- 2. Fix orbit_members policies
DROP POLICY IF EXISTS "Members visible to orbit members" ON orbit_members;
CREATE POLICY "Members visible to orbit members"
  ON orbit_members FOR SELECT USING (
    is_orbit_member(orbit_id, auth.uid())
    OR is_orbit_public(orbit_id)
  );

DROP POLICY IF EXISTS "Users can join public orbits" ON orbit_members;
CREATE POLICY "Users can join public orbits"
  ON orbit_members FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    is_orbit_public(orbit_id)
  );

-- 3. Fix posts policies
DROP POLICY IF EXISTS "Posts visible to orbit members" ON posts;
CREATE POLICY "Posts visible to orbit members"
  ON posts FOR SELECT USING (
    is_orbit_member(orbit_id, auth.uid())
    OR is_orbit_public(orbit_id)
  );

-- 4. Fix events policies
DROP POLICY IF EXISTS "Events viewable by orbit members" ON events;
CREATE POLICY "Events viewable by orbit members"
  ON events FOR SELECT USING (
    is_orbit_member(orbit_id, auth.uid())
    OR is_orbit_public(orbit_id)
  );

-- 5. Fix event_attendees policies
DROP POLICY IF EXISTS "Attendees are viewable by orbit members" ON event_attendees;
CREATE POLICY "Attendees are viewable by orbit members"
  ON event_attendees FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (
        is_orbit_member(e.orbit_id, auth.uid())
        OR is_orbit_public(e.orbit_id)
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
        is_orbit_member(e.orbit_id, auth.uid())
        OR is_orbit_public(e.orbit_id)
      )
    )
  );
