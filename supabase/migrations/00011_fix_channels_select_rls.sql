-- Fix channels SELECT RLS: allow creator to see their own channels
-- even before channel_members entries exist.
-- This is needed so createDMChannel can .select() after insert.

DROP POLICY IF EXISTS "Users can view their channels" ON channels;

CREATE POLICY "Users can view their channels"
  ON channels FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
    )
  );
