-- Task ID: USER_RATING_FEATURE
-- Migration: Add user_rating, rating_count, is_favorite columns to politician_details
-- Created: 2025-11-21
-- Description: Add user rating and favorite tracking to politician_details table

-- ⚠️ CRITICAL: politician_id Type Convention
-- ALL politician_id fields must be TEXT type (NOT BIGINT, NOT INTEGER, NOT UUID)
-- Format: 8-character hexadecimal string (UUID first 8 chars)
-- Examples: '17270f25', 'de49f056', 'eeefba98', '88aaecf2'
-- Generation: str(uuid.uuid4())[:8] (Python)
-- WARNING: NEVER use parseInt() or convert to number in application code!

-- Add user_rating column (average rating from users, 0.0 to 5.0)
ALTER TABLE politician_details
ADD COLUMN IF NOT EXISTS user_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (user_rating >= 0 AND user_rating <= 5);

-- Add rating_count column (number of ratings received)
ALTER TABLE politician_details
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0);

-- Add is_favorite column (whether politician is favorited by current user - client-side computation)
-- Note: This is computed from favorite_politicians table, not stored
COMMENT ON TABLE politician_details IS 'Politician detailed information including ratings and favorites';
COMMENT ON COLUMN politician_details.user_rating IS 'Average user rating (0.00 to 5.00)';
COMMENT ON COLUMN politician_details.rating_count IS 'Total number of user ratings received';

-- Create politician_ratings table for storing individual ratings
CREATE TABLE IF NOT EXISTS politician_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_politician_ratings_politician ON politician_ratings(politician_id);
CREATE INDEX IF NOT EXISTS idx_politician_ratings_user ON politician_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_politician_ratings_created ON politician_ratings(created_at DESC);

-- RLS Policies
ALTER TABLE politician_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY IF NOT EXISTS select_all_ratings ON politician_ratings
  FOR SELECT USING (true);

-- Users can insert their own ratings
CREATE POLICY IF NOT EXISTS insert_own_rating ON politician_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY IF NOT EXISTS update_own_rating ON politician_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY IF NOT EXISTS delete_own_rating ON politician_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update politician_details rating stats
CREATE OR REPLACE FUNCTION update_politician_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_rating_count INTEGER;
BEGIN
  -- Calculate average rating and count
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COALESCE(COUNT(*), 0)
  INTO v_avg_rating, v_rating_count
  FROM politician_ratings
  WHERE politician_id = NEW.politician_id;

  -- UPSERT: Insert or update politician_details
  -- This ensures the record exists even if it wasn't created beforehand
  INSERT INTO politician_details (politician_id, user_rating, rating_count, updated_at)
  VALUES (NEW.politician_id, v_avg_rating, v_rating_count, NOW())
  ON CONFLICT (politician_id) DO UPDATE SET
    user_rating = EXCLUDED.user_rating,
    rating_count = EXCLUDED.rating_count,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
CREATE TRIGGER trigger_update_rating_stats_insert
AFTER INSERT ON politician_ratings
FOR EACH ROW
EXECUTE FUNCTION update_politician_rating_stats();

-- Trigger for UPDATE
CREATE TRIGGER trigger_update_rating_stats_update
AFTER UPDATE ON politician_ratings
FOR EACH ROW
EXECUTE FUNCTION update_politician_rating_stats();

-- Trigger for DELETE
CREATE OR REPLACE FUNCTION update_politician_rating_stats_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_rating_count INTEGER;
BEGIN
  -- Calculate average rating and count after deletion
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COALESCE(COUNT(*), 0)
  INTO v_avg_rating, v_rating_count
  FROM politician_ratings
  WHERE politician_id = OLD.politician_id;

  -- UPSERT: Insert or update politician_details
  INSERT INTO politician_details (politician_id, user_rating, rating_count, updated_at)
  VALUES (OLD.politician_id, v_avg_rating, v_rating_count, NOW())
  ON CONFLICT (politician_id) DO UPDATE SET
    user_rating = EXCLUDED.user_rating,
    rating_count = EXCLUDED.rating_count,
    updated_at = NOW();

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating_stats_delete
AFTER DELETE ON politician_ratings
FOR EACH ROW
EXECUTE FUNCTION update_politician_rating_stats_on_delete();

-- Comments
COMMENT ON TABLE politician_ratings IS 'Individual user ratings for politicians';
COMMENT ON COLUMN politician_ratings.rating IS 'User rating (1 to 5 stars)';
