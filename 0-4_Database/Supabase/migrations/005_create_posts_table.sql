-- Task ID: P2D1
-- Migration: Create posts table
-- Description: Community posts and discussions

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  politician_id UUID REFERENCES politicians(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'question', 'debate', 'news')),
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_politician_id ON posts(politician_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- Full-text search index for Korean
CREATE INDEX idx_posts_search ON posts USING gin(
  to_tsvector('korean', title || ' ' || content)
);

-- Composite indexes for common queries
CREATE INDEX idx_posts_approved_created ON posts(moderation_status, created_at DESC) WHERE moderation_status = 'approved';
CREATE INDEX idx_posts_category_created ON posts(category, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE posts IS 'Community posts and discussions';
COMMENT ON COLUMN posts.category IS 'Post category: general, question, debate, news';
COMMENT ON COLUMN posts.is_pinned IS 'Whether post is pinned to top';
COMMENT ON COLUMN posts.is_locked IS 'Whether post is locked from new comments';
COMMENT ON COLUMN posts.moderation_status IS 'Moderation status: pending, approved, rejected, flagged';
