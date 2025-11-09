-- Task ID: P2D1
-- Migration: Create shares table
-- Description: Social media shares tracking

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'politician', 'pledge')),
  target_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'kakao', 'link', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_target_type ON shares(target_type);
CREATE INDEX idx_shares_target_id ON shares(target_id);
CREATE INDEX idx_shares_platform ON shares(platform);
CREATE INDEX idx_shares_created_at ON shares(created_at DESC);

-- Composite index for analytics
CREATE INDEX idx_shares_target ON shares(target_type, target_id, platform);

-- Comments for documentation
COMMENT ON TABLE shares IS 'Social media shares tracking';
COMMENT ON COLUMN shares.target_type IS 'Type of shared content: post, politician, pledge';
COMMENT ON COLUMN shares.platform IS 'Share platform: facebook, twitter, kakao, link, other';
