-- Orbit Admin Migration
-- Phase G: Member management, join requests, settings

-- 1. Alter orbit_members role check to include 'requested'
ALTER TABLE orbit_members DROP CONSTRAINT IF EXISTS orbit_members_role_check;
ALTER TABLE orbit_members ADD CONSTRAINT orbit_members_role_check
  CHECK (role IN ('owner', 'admin', 'moderator', 'member', 'requested'));

-- 2. Add social links and policies to orbits
ALTER TABLE orbits ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE orbits ADD COLUMN IF NOT EXISTS policies TEXT DEFAULT '';

-- 3. RPC: approve_join_request
CREATE OR REPLACE FUNCTION approve_join_request(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orbit_members
  SET role = 'member', joined_at = NOW()
  WHERE id = p_member_id AND role = 'requested';
  RETURN FOUND;
END;
$$;

-- 4. RPC: reject_join_request
CREATE OR REPLACE FUNCTION reject_join_request(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM orbit_members
  WHERE id = p_member_id AND role = 'requested';
  RETURN FOUND;
END;
$$;

-- 5. RPC: update_member_role
CREATE OR REPLACE FUNCTION update_member_role(p_member_id UUID, p_new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orbit_members
  SET role = p_new_role
  WHERE id = p_member_id AND role != 'owner';
  RETURN FOUND;
END;
$$;

-- 6. RPC: remove_member
CREATE OR REPLACE FUNCTION remove_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM orbit_members
  WHERE id = p_member_id AND role != 'owner';
  RETURN FOUND;
END;
$$;

-- 7. RPC: get_user_orbit_role
CREATE OR REPLACE FUNCTION get_user_orbit_role(p_orbit_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM orbit_members
  WHERE orbit_id = p_orbit_id AND user_id = p_user_id;
  RETURN v_role;
END;
$$;

-- 8. RPC: request_join_orbit
CREATE OR REPLACE FUNCTION request_join_orbit(p_orbit_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO orbit_members (orbit_id, user_id, role)
  VALUES (p_orbit_id, p_user_id, 'requested')
  ON CONFLICT (orbit_id, user_id) DO NOTHING;
  RETURN FOUND;
END;
$$;

-- 9. Update orbits member_count trigger to count only non-requested members
CREATE OR REPLACE FUNCTION update_orbit_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role != 'requested' THEN
    UPDATE orbits SET member_count = member_count + 1 WHERE id = NEW.orbit_id;
  ELSIF TG_OP = 'DELETE' AND OLD.role != 'requested' THEN
    UPDATE orbits SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.orbit_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'requested' AND NEW.role != 'requested' THEN
    UPDATE orbits SET member_count = member_count + 1 WHERE id = NEW.orbit_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_orbit_member_count ON orbit_members;
CREATE TRIGGER trg_update_orbit_member_count
  AFTER INSERT OR DELETE OR UPDATE OF role ON orbit_members
  FOR EACH ROW EXECUTE FUNCTION update_orbit_member_count();
