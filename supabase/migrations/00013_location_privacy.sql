ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_privacy text NOT NULL DEFAULT 'Everyone';
