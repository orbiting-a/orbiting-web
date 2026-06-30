-- Feed Algorithm Migration
-- pgvector extension + scoring function

CREATE EXTENSION IF NOT EXISTS vector;

-- Store interest embeddings for users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interest_embedding vector(384);

-- Store orbit tag embeddings
ALTER TABLE orbits ADD COLUMN IF NOT EXISTS tag_embedding vector(384);

-- Feed scoring function: rank posts for a user
CREATE OR REPLACE FUNCTION get_scored_feed(p_user_id UUID, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  orbit_id UUID,
  author_id UUID,
  content TEXT,
  media_urls TEXT[],
  media_type TEXT,
  like_count INT,
  comment_count INT,
  created_at TIMESTAMPTZ,
  score FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_embedding vector(384);
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get user's interest embedding
  SELECT interest_embedding INTO v_embedding FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  WITH user_orbits AS (
    SELECT orbit_id FROM orbit_members WHERE user_id = p_user_id AND role NOT IN ('requested')
  ),
  scored AS (
    SELECT
      p.id,
      p.orbit_id,
      p.author_id,
      p.content,
      p.media_urls,
      p.media_type,
      p.like_count,
      p.comment_count,
      p.created_at,
      -- Score components:
      -- 1. Recency (0-50): posts within last 24h get max, decays over 7 days
      LEAST(50, EXTRACT(EPOCH FROM (p.created_at - v_now)) / 86400.0 * -50 / 7 + 50) +
      -- 2. Engagement (0-25): likes + comments
      LEAST(25, (p.like_count + p.comment_count * 2) * 2.5) +
      -- 3. Orbit relevance (0-15): member orbits get bonus
      CASE WHEN uo.orbit_id IS NOT NULL THEN 15 ELSE 0 END +
      -- 4. Semantic similarity (0-10): if embeddings available
      CASE WHEN v_embedding IS NOT NULL AND o.tag_embedding IS NOT NULL
        THEN 10 * (1 - (v_embedding <=> o.tag_embedding))
        ELSE 0
      END AS score
    FROM posts p
    LEFT JOIN user_orbits uo ON p.orbit_id = uo.orbit_id
    LEFT JOIN orbits o ON p.orbit_id = o.id
    WHERE o.is_private = FALSE OR uo.orbit_id IS NOT NULL
  )
  SELECT * FROM scored
  ORDER BY score DESC, created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update RLS for stories table (already in 00005)
