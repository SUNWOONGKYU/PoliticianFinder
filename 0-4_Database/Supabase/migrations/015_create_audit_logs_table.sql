-- Task ID: P2D1
-- Migration: Create audit_logs table
-- Description: Audit logs for admin actions (P4BA8)

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_admin_action ON audit_logs(admin_id, action_type, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (e.g., user_ban, post_delete, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with additional action details';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of admin when action was performed';
