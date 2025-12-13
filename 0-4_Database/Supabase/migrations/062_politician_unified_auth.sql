-- Migration 062: Politician Unified Email Authentication System
-- 정치인 통합 이메일 인증 시스템
-- Task: P4BA20
-- Created: 2025-12-13

-- ============================================
-- 1. politicians 테이블에 verified_email 컬럼 추가
-- ============================================
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS verified_email TEXT;

ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_politicians_verified_email
  ON politicians(verified_email);

COMMENT ON COLUMN politicians.verified_email IS '정치인이 직접 인증한 이메일 (계정 ID 역할)';
COMMENT ON COLUMN politicians.email_verified_at IS '이메일 최초 인증 시간';

-- ============================================
-- 2. politician_email_verifications 테이블 (인증 코드 관리)
-- ============================================
CREATE TABLE IF NOT EXISTS politician_email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,  -- NOW() + 10분
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_politician_email_verifications_politician
  ON politician_email_verifications(politician_id);
CREATE INDEX IF NOT EXISTS idx_politician_email_verifications_code
  ON politician_email_verifications(verification_code, expires_at);
CREATE INDEX IF NOT EXISTS idx_politician_email_verifications_created
  ON politician_email_verifications(created_at DESC);

-- RLS
ALTER TABLE politician_email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "politician_email_verifications_select_all" ON politician_email_verifications;
CREATE POLICY "politician_email_verifications_select_all"
  ON politician_email_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "politician_email_verifications_insert_all" ON politician_email_verifications;
CREATE POLICY "politician_email_verifications_insert_all"
  ON politician_email_verifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "politician_email_verifications_update_all" ON politician_email_verifications;
CREATE POLICY "politician_email_verifications_update_all"
  ON politician_email_verifications FOR UPDATE USING (true);

COMMENT ON TABLE politician_email_verifications IS '정치인 이메일 인증 코드 관리 테이블';

-- ============================================
-- 3. politician_sessions 테이블 (세션 관리)
-- ============================================
-- 기존 테이블이 있으면 그대로 사용, 없으면 생성
CREATE TABLE IF NOT EXISTS politician_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,  -- NULL이면 영구, 또는 1년 후
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_politician_sessions_politician
  ON politician_sessions(politician_id);
CREATE INDEX IF NOT EXISTS idx_politician_sessions_token
  ON politician_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_politician_sessions_expires
  ON politician_sessions(expires_at);

-- RLS
ALTER TABLE politician_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "politician_sessions_select_all" ON politician_sessions;
CREATE POLICY "politician_sessions_select_all"
  ON politician_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "politician_sessions_insert_all" ON politician_sessions;
CREATE POLICY "politician_sessions_insert_all"
  ON politician_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "politician_sessions_update_all" ON politician_sessions;
CREATE POLICY "politician_sessions_update_all"
  ON politician_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "politician_sessions_delete_all" ON politician_sessions;
CREATE POLICY "politician_sessions_delete_all"
  ON politician_sessions FOR DELETE USING (true);

COMMENT ON TABLE politician_sessions IS '정치인 인증 세션 관리 테이블 (영구 또는 1년)';

-- ============================================
-- 4. 오래된 인증 코드 자동 정리 함수
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM politician_email_verifications
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 검증 쿼리
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'politicians' AND column_name IN ('verified_email', 'email_verified_at');
-- SELECT * FROM politician_email_verifications LIMIT 1;
-- SELECT * FROM politician_sessions LIMIT 1;
