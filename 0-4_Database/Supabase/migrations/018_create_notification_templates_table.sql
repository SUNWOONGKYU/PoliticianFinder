-- Task ID: P2D1
-- Migration: Create notification_templates table
-- Description: Notification templates management (P4BA11)

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN ('comment', 'like', 'follow', 'mention', 'reply', 'system')),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  variables TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_is_enabled ON notification_templates(is_enabled);

-- Insert default templates
INSERT INTO notification_templates (type, title_template, body_template, variables) VALUES
  ('comment', '{actor_name}님이 댓글을 남겼습니다', '{actor_name}님이 회원님의 게시글에 댓글을 남겼습니다: "{comment_content}"', ARRAY['actor_name', 'comment_content']),
  ('like', '{actor_name}님이 공감했습니다', '{actor_name}님이 회원님의 게시글을 공감했습니다.', ARRAY['actor_name']),
  ('follow', '{actor_name}님이 팔로우했습니다', '{actor_name}님이 회원님을 팔로우했습니다.', ARRAY['actor_name']),
  ('mention', '{actor_name}님이 회원님을 언급했습니다', '{actor_name}님이 게시글에서 회원님을 언급했습니다.', ARRAY['actor_name']),
  ('reply', '{actor_name}님이 답글을 남겼습니다', '{actor_name}님이 회원님의 댓글에 답글을 남겼습니다: "{reply_content}"', ARRAY['actor_name', 'reply_content']),
  ('system', '시스템 알림', '{message}', ARRAY['message'])
ON CONFLICT (type) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE notification_templates IS 'Notification message templates';
COMMENT ON COLUMN notification_templates.title_template IS 'Template for notification title (supports variables)';
COMMENT ON COLUMN notification_templates.body_template IS 'Template for notification body (supports variables)';
COMMENT ON COLUMN notification_templates.variables IS 'List of available template variables';
