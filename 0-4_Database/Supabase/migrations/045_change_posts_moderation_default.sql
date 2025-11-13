-- Migration: Change posts moderation_status default to 'approved'
-- Description: Auto-approve posts instead of requiring manual moderation
-- Date: 2025-11-13
-- Reason: Community posts should be visible immediately without manual approval

-- Change default value for new posts
ALTER TABLE posts ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Update existing pending posts to approved
UPDATE posts SET moderation_status = 'approved' WHERE moderation_status = 'pending';

-- Comments
COMMENT ON COLUMN posts.moderation_status IS 'Moderation status: pending, approved, rejected, flagged (default: approved)';
