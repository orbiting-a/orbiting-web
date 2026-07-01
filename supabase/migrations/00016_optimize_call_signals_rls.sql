-- Optimize call_signals by adding receiver_id and simplifying RLS policies (removing subqueries/joins for Realtime)

-- 1. Add receiver_id column to call_signals
ALTER TABLE call_signals ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Backfill existing call_signals receiver_id from calls table
UPDATE call_signals cs
SET receiver_id = CASE 
  WHEN cs.sender_id = c.caller_id THEN c.callee_id
  ELSE c.caller_id
END
FROM calls c
WHERE cs.call_id = c.id;

-- Make receiver_id NOT NULL for future rows
ALTER TABLE call_signals ALTER COLUMN receiver_id SET NOT NULL;

-- 3. Drop old join-based RLS policies
DROP POLICY IF EXISTS "Participants can view signals" ON call_signals;
DROP POLICY IF EXISTS "Participants can insert signals" ON call_signals;

-- 4. Create new optimized policies (no joins, pure column comparisons)
CREATE POLICY "Participants can view signals"
  ON call_signals FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Participants can insert signals"
  ON call_signals FOR INSERT
  WITH CHECK (sender_id = auth.uid());
