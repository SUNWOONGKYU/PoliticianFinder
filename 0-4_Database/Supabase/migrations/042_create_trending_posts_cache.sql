-- Task ID: P4O2
-- Migration: Create trending_posts_cache table
-- Description: Cache table for storing calculated trending post rankings

-- ============================================================================
-- TRENDING POSTS CACHE TABLE
-- ============================================================================
-- This table stores pre-calculated trending post rankings
-- Updated hourly by the /api/cron/aggregate-trending job

CREATE TABLE IF NOT EXISTS trending_posts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  trend_score NUMERIC NOT NULL,
  snapshot_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fast lookups by rank
CREATE INDEX idx_trending_cache_rank ON trending_posts_cache(rank ASC);

-- Index for finding most recent calculations
CREATE INDEX idx_trending_cache_calculated_at ON trending_posts_cache(calculated_at DESC);

-- Index for post lookups
CREATE INDEX idx_trending_cache_post_id ON trending_posts_cache(post_id);

-- Unique constraint to prevent duplicate entries per calculation
-- (A post should only appear once in the most recent calculation)
CREATE UNIQUE INDEX idx_trending_cache_post_unique ON trending_posts_cache(post_id, calculated_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trending_posts_cache IS 'Cache for pre-calculated trending post rankings (updated hourly)';
COMMENT ON COLUMN trending_posts_cache.post_id IS 'Foreign key to posts table';
COMMENT ON COLUMN trending_posts_cache.rank IS 'Ranking position (1-100)';
COMMENT ON COLUMN trending_posts_cache.trend_score IS 'Calculated trending score: (likes*3 + comments*5 + views*0.1) - (age_hours*2)';
COMMENT ON COLUMN trending_posts_cache.snapshot_data IS 'JSON snapshot of post data at calculation time';
COMMENT ON COLUMN trending_posts_cache.calculated_at IS 'When the trending score was calculated';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE trending_posts_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read trending posts cache (public data)
CREATE POLICY "Trending posts cache is publicly readable"
  ON trending_posts_cache
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete (cron job only)
-- In practice, this is handled by the service role key used by the cron job
-- No explicit policy needed as regular users shouldn't have write access

-- ============================================================================
-- HELPER FUNCTION: Get Latest Trending Posts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_trending_posts(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  rank INTEGER,
  trend_score NUMERIC,
  snapshot_data JSONB,
  calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_calculation AS (
    SELECT MAX(calculated_at) as max_calc
    FROM trending_posts_cache
  )
  SELECT
    tpc.post_id,
    tpc.rank,
    tpc.trend_score,
    tpc.snapshot_data,
    tpc.calculated_at
  FROM trending_posts_cache tpc
  CROSS JOIN latest_calculation lc
  WHERE tpc.calculated_at = lc.max_calc
  ORDER BY tpc.rank ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_trending_posts(INTEGER, INTEGER) IS 'Get the latest trending posts from cache with pagination';

-- ============================================================================
-- CLEANUP FUNCTION: Remove Old Cache Entries
-- ============================================================================
-- Keeps only the most recent 24 calculations (1 day of hourly data)

CREATE OR REPLACE FUNCTION cleanup_old_trending_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM trending_posts_cache
  WHERE calculated_at < (
    SELECT calculated_at
    FROM trending_posts_cache
    ORDER BY calculated_at DESC
    OFFSET 2400  -- Keep 24 hours * 100 posts = 2400 rows
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_trending_cache() IS 'Remove trending cache entries older than 24 hours';

-- ============================================================================
-- OPTIONAL: Automatic cleanup trigger (can be enabled if needed)
-- ============================================================================
-- This would automatically clean up old cache entries after new inserts
-- Commented out by default - cleanup can be done manually or via scheduled job

/*
CREATE OR REPLACE FUNCTION trigger_cleanup_trending_cache()
RETURNS trigger AS $$
BEGIN
  -- Only run cleanup if we have enough rows
  IF (SELECT COUNT(*) FROM trending_posts_cache) > 2500 THEN
    PERFORM cleanup_old_trending_cache();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_trending_cache
  AFTER INSERT ON trending_posts_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_trending_cache();
*/
