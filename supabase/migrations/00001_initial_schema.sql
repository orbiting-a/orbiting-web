-- Orbiting Schema — Initial Migration
-- Run this in Supabase SQL Editor

-- ===== EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== PROFILES (extends auth.users) =====
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  location JSONB DEFAULT '{}'::jsonb,
  interests TEXT[] DEFAULT '{}'::text[],
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_display_name ON profiles USING gin (display_name gin_trgm_ops);

-- ===== ORBITS (Communities) =====
CREATE TABLE orbits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  about TEXT DEFAULT '',
  logo_url TEXT,
  cover_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  is_private BOOLEAN DEFAULT FALSE,
  location JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orbits_name ON orbits USING gin (name gin_trgm_ops);
CREATE INDEX idx_orbits_category ON orbits(category);
CREATE INDEX idx_orbits_slug ON orbits(slug);

-- ===== ORBIT MEMBERS =====
CREATE TABLE orbit_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(orbit_id, user_id)
);

CREATE INDEX idx_orbit_members_orbit ON orbit_members(orbit_id);
CREATE INDEX idx_orbit_members_user ON orbit_members(user_id);

-- ===== POSTS =====
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  media_urls TEXT[] DEFAULT '{}'::text[],
  media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'poll')),
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_orbit ON posts(orbit_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_content ON posts USING gin (to_tsvector('english', content));

-- ===== LIKES =====
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- ===== COMMENTS =====
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ===== FOLLOWS =====
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ===== CHANNELS (Chat) =====
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE SET NULL,
  name TEXT,
  type TEXT CHECK (type IN ('dm', 'group', 'orbit_channel')) DEFAULT 'dm',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CHANNEL MEMBERS =====
CREATE TABLE channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (channel_id, user_id)
);

-- ===== MESSAGES =====
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at);

-- ===== NOTIFICATIONS =====
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ===== EVENTS =====
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT,
  location JSONB DEFAULT '{}'::jsonb,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  attendee_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_orbit ON events(orbit_id);
CREATE INDEX idx_events_starts ON events(starts_at);

-- ===== POLLS =====
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ===== UPDATED_AT TRIGGERS =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orbits_updated_at BEFORE UPDATE ON orbits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== MEMBER COUNT TRIGGERS =====
CREATE OR REPLACE FUNCTION update_orbit_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE orbits SET member_count = member_count + 1 WHERE id = NEW.orbit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE orbits SET member_count = member_count - 1 WHERE id = OLD.orbit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orbit_members_count
  AFTER INSERT OR DELETE ON orbit_members
  FOR EACH ROW EXECUTE FUNCTION update_orbit_member_count();

-- ===== POST COUNT TRIGGER =====
CREATE OR REPLACE FUNCTION update_orbit_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE orbits SET post_count = post_count + 1 WHERE id = NEW.orbit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE orbits SET post_count = post_count - 1 WHERE id = OLD.orbit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orbit_posts_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_orbit_post_count();

-- ===== LIKE COUNT TRIGGERS =====
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ===== COMMENT COUNT TRIGGERS =====
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orbits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orbit_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- Profiles: anyone can view, only self can update
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- Orbits: public orbits visible, private orbits visible to members
CREATE POLICY "Public orbits are viewable by everyone"
  ON orbits FOR SELECT USING (is_private = FALSE);
CREATE POLICY "Private orbits viewable by members"
  ON orbits FOR SELECT USING (
    is_private = FALSE OR
    EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = orbits.id AND user_id = auth.uid())
  );
CREATE POLICY "Authenticated users can create orbits"
  ON orbits FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Orbit owner can update"
  ON orbits FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = orbits.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Orbit members: viewable by members, self-join public, owner manages
CREATE POLICY "Members visible to orbit members"
  ON orbit_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM orbit_members om2 WHERE om2.orbit_id = orbit_members.orbit_id AND om2.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orbits WHERE id = orbit_members.orbit_id AND is_private = FALSE)
  );
CREATE POLICY "Users can join public orbits"
  ON orbit_members FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM orbits WHERE id = orbit_id AND is_private = FALSE)
  );
CREATE POLICY "Users can leave orbits"
  ON orbit_members FOR DELETE USING (user_id = auth.uid());

-- Posts: visible to orbit members, any authenticated can create in joined orbits
CREATE POLICY "Posts visible to orbit members"
  ON posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = posts.orbit_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orbits WHERE id = posts.orbit_id AND is_private = FALSE)
  );
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND author_id = auth.uid()
  );
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (author_id = auth.uid());

-- Likes: viewable by everyone, toggle by authenticated
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE USING (user_id = auth.uid());

-- Comments: viewable by everyone, create/update/delete own
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (TRUE);
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (author_id = auth.uid());

-- Follows: viewable by everyone, toggle by authenticated
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (TRUE);
CREATE POLICY "Users can follow"
  ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (follower_id = auth.uid());

-- Notifications: only the recipient
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Events: viewable by orbit members
CREATE POLICY "Events viewable by orbit members"
  ON events FOR SELECT USING (
    EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = events.orbit_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orbits WHERE id = events.orbit_id AND is_private = FALSE)
  );
CREATE POLICY "Orbit members can create events"
  ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orbit_members WHERE orbit_id = events.orbit_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator'))
  );

-- ===== STORAGE BUCKET =====
INSERT INTO storage.buckets (id, name, public) VALUES ('orbit-media', 'orbit-media', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media files are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'orbit-media');
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'orbit-media' AND auth.uid() IS NOT NULL
  );
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'orbit-media' AND owner = auth.uid()
  );
