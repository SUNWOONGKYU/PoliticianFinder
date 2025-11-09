-- Task ID: P2D1
-- Migration: Create system_settings table
-- Description: Global system settings management (P4BA12)

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description, category) VALUES
  -- Point settings
  ('points.post', '10', 'Points awarded for creating a post', 'points'),
  ('points.comment', '5', 'Points awarded for writing a comment', 'points'),
  ('points.like', '1', 'Points awarded for liking content', 'points'),
  ('points.follow', '20', 'Points awarded for following a user', 'points'),
  ('points.daily_login', '5', 'Points awarded for daily login', 'points'),
  ('points.share', '3', 'Points awarded for sharing content', 'points'),

  -- Feature toggles
  ('features.community', 'true', 'Enable community features', 'features'),
  ('features.ai_evaluation', 'true', 'Enable AI evaluation features', 'features'),
  ('features.politician_verification', 'true', 'Enable politician verification', 'features'),
  ('features.notifications', 'true', 'Enable notifications system', 'features'),
  ('features.advertisements', 'true', 'Enable advertisements', 'features'),

  -- Maintenance
  ('maintenance.enabled', 'false', 'Maintenance mode enabled', 'maintenance'),
  ('maintenance.message', '"서비스 점검 중입니다. 잠시 후 다시 시도해주세요."', 'Maintenance mode message', 'maintenance'),
  ('maintenance.allowed_ips', '[]', 'IP addresses allowed during maintenance', 'maintenance'),

  -- Limits
  ('limits.post_length', '10000', 'Maximum post content length', 'limits'),
  ('limits.comment_length', '1000', 'Maximum comment content length', 'limits'),
  ('limits.upload_size_mb', '10', 'Maximum file upload size in MB', 'limits'),
  ('limits.daily_posts', '10', 'Maximum posts per day per user', 'limits'),
  ('limits.daily_comments', '50', 'Maximum comments per day per user', 'limits')
ON CONFLICT (key) DO NOTHING;

-- Index for performance
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- Comments for documentation
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN system_settings.key IS 'Setting key in dot notation (e.g., points.post)';
COMMENT ON COLUMN system_settings.value IS 'Setting value stored as JSON';
COMMENT ON COLUMN system_settings.category IS 'Setting category for organization';
