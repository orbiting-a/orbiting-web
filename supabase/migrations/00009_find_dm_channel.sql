CREATE OR REPLACE FUNCTION find_dm_channel(user1_id UUID, user2_id UUID)
RETURNS TABLE (id UUID, orbit_id UUID, name TEXT, type TEXT, created_by UUID, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE
AS $$
  SELECT c.id, c.orbit_id, c.name, c.type, c.created_by, c.created_at
  FROM channels c
  WHERE c.type = 'dm'
    AND EXISTS (
      SELECT 1 FROM channel_members cm1
      WHERE cm1.channel_id = c.id AND cm1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM channel_members cm2
      WHERE cm2.channel_id = c.id AND cm2.user_id = user2_id
    )
  LIMIT 1;
$$;
