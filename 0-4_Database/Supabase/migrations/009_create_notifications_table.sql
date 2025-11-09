-- Task ID: P2D1
-- Migration: Create notifications table
-- Description: User notifications for various activities

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like', 'follow', 'mention', 'reply', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT,
  target_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for various activities';
COMMENT ON COLUMN notifications.type IS 'Notification type: comment, like, follow, mention, reply, system';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification';
COMMENT ON COLUMN notifications.target_type IS 'Type of target object (post, comment, politician, etc.)';
COMMENT ON COLUMN notifications.target_id IS 'ID of target object';
