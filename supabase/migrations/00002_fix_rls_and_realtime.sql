-- Fix RLS recursion and enable Realtime for chat

-- ===== 1. Fix orbit_members RLS recursion =====
-- Create a security definer function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_orbit_member(orbit_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM orbit_members WHERE orbit_members.orbit_id = $1 AND orbit_members.user_id = $2);
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members visible to orbit members" ON orbit_members;

-- Create fixed policy using the security definer function
CREATE POLICY "Members visible to orbit members"
  ON orbit_members FOR SELECT USING (
    is_orbit_member(orbit_id, auth.uid())
    OR EXISTS (SELECT 1 FROM orbits WHERE id = orbit_members.orbit_id AND is_private = FALSE)
  );

-- Also fix the orbit INSERT/UPDATE policies to use the function
DROP POLICY IF EXISTS "Orbit owner can update" ON orbits;
CREATE POLICY "Orbit owner can update"
  ON orbits FOR UPDATE USING (
    created_by = auth.uid() OR
    is_orbit_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Events viewable by orbit members" ON events;
CREATE POLICY "Events viewable by orbit members"
  ON events FOR SELECT USING (
    is_orbit_member(orbit_id, auth.uid())
    OR EXISTS (SELECT 1 FROM orbits WHERE id = events.orbit_id AND is_private = FALSE)
  );

-- ===== 2. Enable Realtime for chat tables =====
-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;

-- ===== 3. Notification trigger for likes/comments/follows =====
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    p.author_id,
    'like',
    'New Like',
    (SELECT display_name FROM profiles WHERE id = NEW.user_id) || ' liked your post',
    jsonb_build_object('post_id', NEW.post_id, 'user_id', NEW.user_id)
  FROM posts p
  WHERE p.id = NEW.post_id AND p.author_id != NEW.user_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_notify
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    p.author_id,
    'comment',
    'New Comment',
    (SELECT display_name FROM profiles WHERE id = NEW.author_id) || ' commented on your post',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'user_id', NEW.author_id)
  FROM posts p
  WHERE p.id = NEW.post_id AND p.author_id != NEW.author_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    (SELECT display_name FROM profiles WHERE id = NEW.follower_id) || ' started following you',
    jsonb_build_object('user_id', NEW.follower_id)
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_follow_notify
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();
