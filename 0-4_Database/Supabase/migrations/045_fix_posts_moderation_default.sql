-- Migration: Fix posts moderation_status default value
-- Description: Change default from 'pending' to 'approved' for immediate visibility
-- Issue: Posts were invisible due to RLS policy requiring 'approved' status

-- 1. Change default value for new posts
ALTER TABLE posts
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- 2. Update existing posts with 'pending' status to 'approved'
-- (Only if you want to make existing posts visible)
UPDATE posts
SET moderation_status = 'approved',
    moderated_at = NOW()
WHERE moderation_status = 'pending';

-- Comments
COMMENT ON COLUMN posts.moderation_status IS 'Moderation status: pending, approved, rejected, flagged. Default is approved for immediate visibility.';
