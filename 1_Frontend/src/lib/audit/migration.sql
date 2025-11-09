/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - Database Migration
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1 (Database 스키마)
 * 설명: audit_logs 테이블 생성 및 인덱스 설정
 */

-- =====================================================
-- 감사 로그 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================

-- 관리자별 로그 조회 최적화
CREATE INDEX IF NOT EXISTS idx_audit_admin
ON audit_logs(admin_id);

-- 액션 타입별 로그 조회 최적화
CREATE INDEX IF NOT EXISTS idx_audit_action
ON audit_logs(action_type);

-- 생성일시 정렬 최적화 (최신순 조회)
CREATE INDEX IF NOT EXISTS idx_audit_created
ON audit_logs(created_at DESC);

-- 타겟별 로그 조회 최적화
CREATE INDEX IF NOT EXISTS idx_audit_target
ON audit_logs(target_type, target_id);

-- 복합 인덱스: 관리자 + 생성일시 (관리자별 최근 활동 조회)
CREATE INDEX IF NOT EXISTS idx_audit_admin_created
ON audit_logs(admin_id, created_at DESC);

-- 복합 인덱스: 액션타입 + 생성일시 (특정 액션 타입의 최근 로그 조회)
CREATE INDEX IF NOT EXISTS idx_audit_action_created
ON audit_logs(action_type, created_at DESC);

-- =====================================================
-- RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 관리자만 삽입 가능
CREATE POLICY "Admins can insert audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  AND admin_id = auth.uid()
);

-- 삭제 및 수정 금지 (감사 로그는 불변)
CREATE POLICY "Audit logs cannot be updated"
ON audit_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON audit_logs
FOR DELETE
TO authenticated
USING (false);

-- =====================================================
-- 코멘트 추가 (문서화)
-- =====================================================

COMMENT ON TABLE audit_logs IS '관리자 액션 감사 로그';
COMMENT ON COLUMN audit_logs.id IS '로그 고유 ID';
COMMENT ON COLUMN audit_logs.admin_id IS '관리자 사용자 ID (profiles 참조)';
COMMENT ON COLUMN audit_logs.action_type IS '액션 타입 (user_ban, post_delete 등)';
COMMENT ON COLUMN audit_logs.target_type IS '대상 타입 (user, post, comment 등)';
COMMENT ON COLUMN audit_logs.target_id IS '대상 ID';
COMMENT ON COLUMN audit_logs.details IS '추가 세부 정보 (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS '요청 IP 주소';
COMMENT ON COLUMN audit_logs.user_agent IS '요청 User Agent';
COMMENT ON COLUMN audit_logs.created_at IS '로그 생성 시간';

-- =====================================================
-- 파티션 설정 (선택적 - 대용량 데이터 처리)
-- =====================================================

-- 월별 파티션 예제 (PostgreSQL 10+)
-- 대량의 로그가 예상되는 경우 파티션 테이블로 전환 고려

-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- =====================================================
-- 성능 모니터링용 뷰
-- =====================================================

-- 액션 타입별 통계 뷰
CREATE OR REPLACE VIEW audit_logs_statistics AS
SELECT
  action_type,
  COUNT(*) as total_count,
  COUNT(DISTINCT admin_id) as unique_admins,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM audit_logs
GROUP BY action_type
ORDER BY total_count DESC;

-- 관리자별 활동 통계 뷰
CREATE OR REPLACE VIEW admin_activity_statistics AS
SELECT
  admin_id,
  COUNT(*) as total_actions,
  COUNT(DISTINCT action_type) as unique_action_types,
  MIN(created_at) as first_action,
  MAX(created_at) as last_action
FROM audit_logs
GROUP BY admin_id
ORDER BY total_actions DESC;

-- =====================================================
-- 데이터 보존 정책 함수 (선택적)
-- =====================================================

-- 오래된 로그 아카이빙 함수 (예: 1년 이상 된 로그 삭제)
CREATE OR REPLACE FUNCTION archive_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_audit_logs IS '지정된 보존 기간이 지난 감사 로그 삭제';

-- =====================================================
-- 완료
-- =====================================================
