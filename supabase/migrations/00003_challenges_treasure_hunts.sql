-- Challenges & Treasure Hunts Schema
-- Run this in Supabase SQL Editor

-- ===== CHALLENGES =====
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT CHECK (type IN ('photo', 'video', 'text', 'location')) DEFAULT 'text',
  cover_url TEXT,
  location JSONB DEFAULT '{}'::jsonb,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_orbit ON challenges(orbit_id);

-- ===== TREASURE HUNTS =====
CREATE TABLE IF NOT EXISTS treasure_hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== RIDDLES =====
CREATE TABLE IF NOT EXISTS riddles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasure_hunt_id UUID REFERENCES treasure_hunts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hint TEXT DEFAULT '',
  level INT DEFAULT 1,
  answer_type TEXT CHECK (answer_type IN ('code', 'location')) DEFAULT 'code',
  answer TEXT NOT NULL,
  lat DECIMAL,
  lng DECIMAL,
  max_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riddles_hunt ON riddles(treasure_hunt_id);

-- ===== TREASURE HUNT PARTICIPANTS =====
CREATE TABLE IF NOT EXISTS treasure_hunt_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasure_hunt_id UUID REFERENCES treasure_hunts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_level INT DEFAULT 1,
  score INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(treasure_hunt_id, user_id)
);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasure_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE riddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasure_hunt_participants ENABLE ROW LEVEL SECURITY;

-- Everyone can read challenges
CREATE POLICY "challenges_select" ON challenges FOR SELECT USING (TRUE);
-- Authenticated users can create
CREATE POLICY "challenges_insert" ON challenges FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "treasure_hunts_select" ON treasure_hunts FOR SELECT USING (TRUE);
CREATE POLICY "treasure_hunts_insert" ON treasure_hunts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "riddles_select" ON riddles FOR SELECT USING (TRUE);
CREATE POLICY "riddles_insert" ON riddles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "participants_select" ON treasure_hunt_participants FOR SELECT USING (TRUE);
CREATE POLICY "participants_insert" ON treasure_hunt_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "participants_update" ON treasure_hunt_participants FOR UPDATE USING (auth.uid() = user_id);
