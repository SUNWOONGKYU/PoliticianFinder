-- Migration: Approve all existing pending posts
-- Description: Fix the issue where existing posts are not visible due to RLS policy
-- Date: 2025-11-13
-- Reason: Previous migration (045) changed default but didn't update existing records

-- Update all existing pending posts to approved status
UPDATE posts
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM posts WHERE moderation_status = 'approved';
  RAISE NOTICE 'Total approved posts: %', updated_count;
END $$;
