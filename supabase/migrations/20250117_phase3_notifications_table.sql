-- P3D1: notifications 테이블 개선
-- 사용자 알림 시스템 고도화
-- 작성일: 2025-01-17
-- 작성자: AI-only
-- Phase: 3

-- ============================================
-- 1. 기존 테이블 삭제 (존재하는 경우)
-- ============================================

-- 기존 notifications 테이블 백업
CREATE TABLE IF NOT EXISTS notifications_backup AS
SELECT * FROM notifications WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'notifications'
);

-- 기존 테이블 삭제
DROP TABLE IF EXISTS notifications CASCADE;

-- ============================================
-- 2. 향상된 notifications 테이블 생성
-- ============================================

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,

  -- 수신자 정보
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 발신자 정보 (시스템 알림의 경우 NULL)
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 알림 유형 (확장된 타입)
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'comment',           -- 댓글 알림
    'reply',            -- 답글 알림
    'mention',          -- 멘션 알림
    'like',             -- 좋아요 알림
    'follow',           -- 팔로우 알림
    'rating',           -- 평가 알림
    'post_update',      -- 게시글 업데이트
    'system',           -- 시스템 알림
    'achievement',      -- 업적 달성
    'level_up',         -- 레벨업
    'badge',            -- 배지 획득
    'warning',          -- 경고
    'announcement'      -- 공지사항
  )),

  -- 알림 내용
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- 관련 엔티티 정보 (다형성 지원)
  entity_type VARCHAR(50) CHECK (entity_type IN (
    'post', 'comment', 'politician', 'user', 'rating', 'badge', 'achievement'
  )),
  entity_id BIGINT,

  -- 추가 메타데이터
  metadata JSONB DEFAULT '{}',

  -- 알림 링크
  action_url TEXT,

  -- 알림 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 알림 중요도
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- 알림 만료일 (NULL = 영구)
  expires_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 테이블 설명 추가
-- ============================================

COMMENT ON TABLE notifications IS '사용자 알림 시스템 테이블';
COMMENT ON COLUMN notifications.id IS '알림 고유 식별자';
COMMENT ON COLUMN notifications.recipient_id IS '알림 수신자 ID';
COMMENT ON COLUMN notifications.sender_id IS '알림 발신자 ID (시스템 알림은 NULL)';
COMMENT ON COLUMN notifications.type IS '알림 유형';
COMMENT ON COLUMN notifications.title IS '알림 제목';
COMMENT ON COLUMN notifications.message IS '알림 메시지';
COMMENT ON COLUMN notifications.entity_type IS '관련 엔티티 타입';
COMMENT ON COLUMN notifications.entity_id IS '관련 엔티티 ID';
COMMENT ON COLUMN notifications.metadata IS '추가 메타데이터 (JSON)';
COMMENT ON COLUMN notifications.action_url IS '알림 클릭시 이동할 URL';
COMMENT ON COLUMN notifications.is_read IS '읽음 여부';
COMMENT ON COLUMN notifications.read_at IS '읽은 시간';
COMMENT ON COLUMN notifications.priority IS '알림 중요도';
COMMENT ON COLUMN notifications.expires_at IS '알림 만료일';

-- ============================================
-- 4. 인덱스 생성 (성능 최적화)
-- ============================================

-- 수신자별 알림 조회 최적화
CREATE INDEX idx_notifications_recipient_id
ON notifications(recipient_id);

-- 읽지 않은 알림 조회 최적화
CREATE INDEX idx_notifications_unread
ON notifications(recipient_id, is_read)
WHERE is_read = FALSE;

-- 타입별 알림 조회 최적화
CREATE INDEX idx_notifications_type
ON notifications(recipient_id, type);

-- 최신 알림 정렬 최적화
CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);

-- 우선순위별 알림 조회 최적화
CREATE INDEX idx_notifications_priority
ON notifications(recipient_id, priority, created_at DESC)
WHERE is_read = FALSE;

-- 만료되지 않은 알림 조회 최적화
CREATE INDEX idx_notifications_active
ON notifications(recipient_id, expires_at)
WHERE expires_at IS NULL OR expires_at > NOW();

-- 엔티티별 알림 조회 최적화
CREATE INDEX idx_notifications_entity
ON notifications(entity_type, entity_id)
WHERE entity_type IS NOT NULL;

-- ============================================
-- 5. updated_at 자동 업데이트 트리거
-- ============================================

-- 트리거 함수 (이미 존재하는 경우 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 읽음 처리 시 read_at 자동 설정 트리거
-- ============================================

CREATE OR REPLACE FUNCTION set_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notifications_read_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_read_at();

-- ============================================
-- 7. 만료된 알림 자동 삭제 함수
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Row Level Security 정책
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = recipient_id);

-- 시스템과 관리자만 알림 생성
CREATE POLICY "System and admins can create notifications"
ON notifications FOR INSERT
WITH CHECK (
  -- 시스템 서비스 계정 또는 관리자
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = TRUE
  )
  OR
  -- Edge Function을 통한 생성 (서비스 역할)
  auth.role() = 'service_role'
);

-- 본인 알림만 수정 (읽음 처리)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- 본인 알림만 삭제
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = recipient_id);

-- ============================================
-- 9. 알림 통계 뷰
-- ============================================

CREATE OR REPLACE VIEW notification_stats AS
SELECT
  recipient_id,
  COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE type = 'comment') as comment_count,
  COUNT(*) FILTER (WHERE type = 'like') as like_count,
  COUNT(*) FILTER (WHERE type = 'mention') as mention_count,
  COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE) as urgent_unread,
  MAX(created_at) as last_notification_at
FROM notifications
WHERE expires_at IS NULL OR expires_at > NOW()
GROUP BY recipient_id;

COMMENT ON VIEW notification_stats IS '사용자별 알림 통계';

-- ============================================
-- 10. 헬퍼 함수: 알림 생성
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_message TEXT,
  p_sender_id UUID DEFAULT NULL,
  p_entity_type VARCHAR(50) DEFAULT NULL,
  p_entity_id BIGINT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_notification_id BIGINT;
BEGIN
  INSERT INTO notifications (
    recipient_id, sender_id, type, title, message,
    entity_type, entity_id, action_url, priority,
    metadata, expires_at
  ) VALUES (
    p_recipient_id, p_sender_id, p_type, p_title, p_message,
    p_entity_type, p_entity_id, p_action_url, p_priority,
    p_metadata, p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. 테이블 생성 확인
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    RAISE NOTICE 'notifications 테이블이 성공적으로 생성되었습니다.';

    -- 컬럼 정보
    RAISE NOTICE '컬럼 목록:';
    FOR r IN (
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    ) LOOP
      RAISE NOTICE '  - % (%): nullable=%', r.column_name, r.data_type, r.is_nullable;
    END LOOP;

    -- 인덱스 정보
    RAISE NOTICE '인덱스 목록:';
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'notifications'
      ORDER BY indexname
    ) LOOP
      RAISE NOTICE '  - %', r.indexname;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'notifications 테이블 생성에 실패했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. Realtime 구독 활성화
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'P3D1: notifications 테이블이 성공적으로 생성되었습니다.';
  RAISE NOTICE '- 확장된 알림 타입 지원';
  RAISE NOTICE '- 우선순위 및 만료 기능';
  RAISE NOTICE '- 메타데이터 저장 지원';
  RAISE NOTICE '- RLS 정책 적용 완료';
  RAISE NOTICE '- Realtime 구독 활성화';
  RAISE NOTICE '==============================================';
END;
$$ LANGUAGE plpgsql;