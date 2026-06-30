-- ===== Chat RLS Policies =====
-- The messages, channels, and channel_members tables had RLS enabled
-- but no policies, making chat non-functional.

-- ===== CHANNELS =====

-- Users can see channels they are a member of
CREATE POLICY "Users can view their channels"
  ON channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create channels
CREATE POLICY "Authenticated users can create channels"
  ON channels FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only channel creator can update
CREATE POLICY "Channel creator can update"
  ON channels FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ===== CHANNEL MEMBERS =====

-- Users can see members of channels they belong to
CREATE POLICY "Users can view members of their channels"
  ON channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
    )
  );

-- Authenticated users can add members to channels
CREATE POLICY "Authenticated users can add channel members"
  ON channel_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can remove themselves from a channel
CREATE POLICY "Users can remove themselves"
  ON channel_members FOR DELETE
  USING (user_id = auth.uid());

-- ===== MESSAGES =====

-- Users can read messages in channels they belong to
CREATE POLICY "Users can view messages in their channels"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Users can send messages to channels they belong to
CREATE POLICY "Users can insert messages in their channels"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());
