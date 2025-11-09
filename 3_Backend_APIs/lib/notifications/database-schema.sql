/**
 * P4BA11: Database Schema for Notification System
 * 작업일: 2025-11-09
 * 설명: 알림 설정 및 템플릿 테이블 스키마
 */

-- =====================================================
-- 1. 알림 전역 설정 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  notifications_enabled BOOLEAN DEFAULT true,
  batch_processing_enabled BOOLEAN DEFAULT false,
  batch_interval_minutes INTEGER DEFAULT 15 CHECK (batch_interval_minutes >= 1 AND batch_interval_minutes <= 1440),
  max_notifications_per_user INTEGER DEFAULT 50 CHECK (max_notifications_per_user >= 1 AND max_notifications_per_user <= 100),
  rate_limit_per_minute INTEGER DEFAULT 100 CHECK (rate_limit_per_minute >= 1 AND rate_limit_per_minute <= 1000),
  email_notifications_enabled BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT single_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001')
);

-- 전역 설정 초기 데이터 (단일 레코드)
INSERT INTO notification_settings (
  id,
  notifications_enabled,
  batch_processing_enabled,
  batch_interval_minutes,
  max_notifications_per_user,
  rate_limit_per_minute,
  email_notifications_enabled,
  push_notifications_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,
  false,
  15,
  50,
  100,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. 알림 템플릿 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 템플릿 타입 체크 제약
ALTER TABLE notification_templates
ADD CONSTRAINT valid_notification_type
CHECK (type IN ('comment', 'like', 'follow', 'mention', 'reply', 'system'));

-- 템플릿 초기 데이터
INSERT INTO notification_templates (type, title_template, body_template, is_enabled) VALUES
('comment', '{작성자}님이 댓글을 남겼습니다', '{작성자}님이 회원님의 게시글에 댓글을 남겼습니다: "{댓글내용}"', true),
('like', '{작성자}님이 공감했습니다', '{작성자}님이 회원님의 게시글을 공감했습니다.', true),
('follow', '{작성자}님이 팔로우했습니다', '{작성자}님이 회원님을 팔로우했습니다.', true),
('mention', '{작성자}님이 회원님을 언급했습니다', '{작성자}님이 게시글에서 회원님을 언급했습니다.', true),
('reply', '{작성자}님이 답글을 남겼습니다', '{작성자}님이 회원님의 댓글에 답글을 남겼습니다: "{댓글내용}"', true),
('system', '시스템 알림', '{메시지}', true)
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- 3. 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_enabled ON notification_templates(is_enabled);

-- =====================================================
-- 4. 트리거 (updated_at 자동 업데이트)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- notification_settings 트리거
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- notification_templates 트리거
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. RLS (Row Level Security) 정책
-- =====================================================

-- notification_settings RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admin can view notification settings"
ON notification_settings FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- 관리자만 수정 가능
CREATE POLICY "Admin can update notification settings"
ON notification_settings FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- notification_templates RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admin can view notification templates"
ON notification_templates FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- 관리자만 수정 가능
CREATE POLICY "Admin can update notification templates"
ON notification_templates FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- =====================================================
-- 6. 코멘트
-- =====================================================
COMMENT ON TABLE notification_settings IS '알림 시스템 전역 설정 (단일 레코드)';
COMMENT ON TABLE notification_templates IS '알림 타입별 메시지 템플릿';

COMMENT ON COLUMN notification_settings.notifications_enabled IS '알림 기능 전체 활성화/비활성화';
COMMENT ON COLUMN notification_settings.batch_processing_enabled IS '배치 처리 활성화 여부';
COMMENT ON COLUMN notification_settings.batch_interval_minutes IS '배치 처리 간격 (분)';
COMMENT ON COLUMN notification_settings.max_notifications_per_user IS '사용자당 최대 알림 수';
COMMENT ON COLUMN notification_settings.rate_limit_per_minute IS '분당 알림 발송 제한';

COMMENT ON COLUMN notification_templates.type IS '알림 타입 (comment, like, follow, mention, reply, system)';
COMMENT ON COLUMN notification_templates.title_template IS '알림 제목 템플릿';
COMMENT ON COLUMN notification_templates.body_template IS '알림 본문 템플릿';
COMMENT ON COLUMN notification_templates.is_enabled IS '템플릿 활성화 여부';
