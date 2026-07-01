-- Fix RLS infinite recursion on channel_members SELECT policy.
-- The old policy used `EXISTS (SELECT 1 FROM channel_members cm ...)` which
-- queries the same table the policy is on, causing infinite recursion on PG 15+.

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members of their channels" ON channel_members;

-- Create a SECURITY DEFINER helper to bypass RLS recursion
CREATE OR REPLACE FUNCTION is_channel_member(channel_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = $1
    AND channel_members.user_id = $2
  );
$$;

-- Recreate the policy using the helper function
CREATE POLICY "Users can view members of their channels"
  ON channel_members FOR SELECT
  USING (is_channel_member(channel_id, auth.uid()));
