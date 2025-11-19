-- Fix comment_likes and shares table schemas
-- Problem 1: comment_likes.comment_id is INTEGER but comments.id is UUID
-- Problem 2: shares table structure unknown

-- ============================================================================
-- CRITICAL: BACKUP EXISTING DATA FIRST
-- ============================================================================
-- This script will DROP and RECREATE tables
-- Make sure to backup any existing data first!

-- ============================================================================
-- Step 1: Drop and recreate comment_likes table with correct schema
-- ============================================================================
DROP TABLE IF EXISTS comment_likes CASCADE;

CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX idx_comment_likes_created_at ON comment_likes(created_at);

COMMENT ON TABLE comment_likes IS 'Stores likes on comments';

-- ============================================================================
-- Step 2: Fix shares table structure
-- ============================================================================
-- First check if shares table exists and drop it
DROP TABLE IF EXISTS shares CASCADE;

-- Recreate with correct structure
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,  -- Simple post_id column
  politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE,  -- Optional politician sharing
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'kakao', 'link', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (post_id IS NOT NULL OR politician_id IS NOT NULL)  -- At least one must be set
);

CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_post_id ON shares(post_id);
CREATE INDEX idx_shares_politician_id ON shares(politician_id);
CREATE INDEX idx_shares_created_at ON shares(created_at);

COMMENT ON TABLE shares IS 'Stores social media shares of posts and politicians';

-- ============================================================================
-- Step 3: Enable RLS if needed
-- ============================================================================
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: Create RLS policies
-- ============================================================================

-- comment_likes policies
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create comment likes"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- shares policies
CREATE POLICY "Anyone can view shares"
  ON shares FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create shares"
  ON shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON shares FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Done!
-- ============================================================================
SELECT 'Schema fix completed successfully!' as status;
