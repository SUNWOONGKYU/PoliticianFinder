-- Migration: Fix notifications table schema
-- Description: Add missing columns required by comment notification trigger
-- Date: 2025-12-29
-- Reason: Trigger function create_comment_notification() references columns
--         that don't exist in the current notifications table

-- ============================================================================
-- OPTION 1: RECOMMENDED - Add missing columns to notifications table
-- ============================================================================

-- Add actor_id column (who triggered the notification)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add title column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add message column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add link_url column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add target_type column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_type TEXT;

-- Add target_id column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_id UUID;

-- Create index for actor_id
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- ============================================================================
-- OPTION 2: ALTERNATIVE - Drop the triggers if columns can't be added
-- ============================================================================

-- Uncomment these lines if Option 1 doesn't work:
-- DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
-- DROP TRIGGER IF EXISTS trigger_reply_notification ON comments;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run this to verify the columns were added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'notifications';
