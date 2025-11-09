-- Task ID: P2D1
-- Migration: Create admin_actions table
-- Description: Admin activity tracking and statistics (P4BA13)

-- Admin actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  result TEXT CHECK (result IN ('success', 'failure')),
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX idx_admin_actions_result ON admin_actions(result);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Composite indexes for analytics
CREATE INDEX idx_admin_actions_admin_type ON admin_actions(admin_id, action_type, created_at DESC);
CREATE INDEX idx_admin_actions_type_date ON admin_actions(action_type, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE admin_actions IS 'Admin activity tracking for statistics and monitoring';
COMMENT ON COLUMN admin_actions.action_type IS 'Type of admin action performed';
COMMENT ON COLUMN admin_actions.result IS 'Action result: success or failure';
COMMENT ON COLUMN admin_actions.duration_ms IS 'Time taken to complete action in milliseconds';
COMMENT ON COLUMN admin_actions.metadata IS 'Additional action metadata';
