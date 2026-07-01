-- Calls table for tracking active/ringing calls
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Call signals for WebRTC SDP + ICE exchange
CREATE TABLE IF NOT EXISTS call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up active calls by channel
CREATE INDEX IF NOT EXISTS idx_calls_channel_status ON calls(channel_id, status);

-- Index for looking up signals by call
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON call_signals(call_id);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Policies: participants can see their calls
CREATE POLICY "Participants can view calls"
  ON calls FOR SELECT
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Participants can insert calls (as caller)
CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  WITH CHECK (caller_id = auth.uid());

-- Participants can update calls they're part of
CREATE POLICY "Participants can update calls"
  ON calls FOR UPDATE
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Participants can see signals for their calls
CREATE POLICY "Participants can view signals"
  ON call_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_signals.call_id
      AND (calls.caller_id = auth.uid() OR calls.callee_id = auth.uid())
    )
  );

-- Participants can insert signals
CREATE POLICY "Participants can insert signals"
  ON call_signals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_signals.call_id
      AND (calls.caller_id = auth.uid() OR calls.callee_id = auth.uid())
    )
  );

-- Add calls and call_signals to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
