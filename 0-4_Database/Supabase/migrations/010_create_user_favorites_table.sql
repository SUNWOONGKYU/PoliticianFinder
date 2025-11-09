-- Task ID: P2D1
-- Migration: Create user_favorites table
-- Description: User's favorite politicians tracking

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, politician_id)
);

-- Indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_politician_id ON user_favorites(politician_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE user_favorites IS 'User favorite politicians tracking';
