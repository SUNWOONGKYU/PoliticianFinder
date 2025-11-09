-- Task ID: P2D1
-- Migration: Create comments table
-- Description: Comments on posts with nested replies support

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_comments_post_approved ON comments(post_id, moderation_status, created_at) WHERE moderation_status = 'approved';
CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_comments_search ON comments USING gin(
  to_tsvector('korean', content)
);

-- Comments for documentation
COMMENT ON TABLE comments IS 'Comments on posts with nested reply support';
COMMENT ON COLUMN comments.parent_comment_id IS 'Parent comment ID for nested replies (NULL for top-level comments)';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete flag (content hidden but structure preserved)';
COMMENT ON COLUMN comments.moderation_status IS 'Moderation status: pending, approved, rejected, flagged';
