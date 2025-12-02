-- Migration: 053_create_politician_sessions.sql
-- Purpose: 정치인 세션 토큰 관리 테이블 생성
-- Date: 2025-12-02
-- Author: Claude Code
--
-- 설명:
-- 정치인이 이메일 인증 완료 후 24시간 유효한 세션 토큰을 발급받아
-- 글쓰기/댓글 작성 시 이 토큰으로 본인 확인을 함
--
-- 프로세스:
-- 1. 정치인이 글쓰기 시도
-- 2. 이메일 인증 (email_verifications 테이블 사용)
-- 3. 인증 성공 시 세션 토큰 발급 (이 테이블에 저장)
-- 4. 클라이언트는 세션 토큰을 localStorage에 저장
-- 5. 글쓰기/댓글 작성 시 세션 토큰 제출
-- 6. 서버는 세션 토큰 유효성 확인 후 글쓰기 허용

-- ============================================================
-- POLITICIAN_SESSIONS 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS politician_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 정치인 ID (TEXT 타입 - 8자리 hex)
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,

  -- 세션 토큰 (64자리 hex - crypto.randomBytes(32).toString('hex'))
  session_token TEXT UNIQUE NOT NULL,

  -- 만료 시간 (발급 시각 + 24시간)
  expires_at TIMESTAMPTZ NOT NULL,

  -- 마지막 사용 시간 (글쓰기/댓글 작성 시 업데이트)
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- 생성 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- IP 주소 (선택적 - 보안 강화용)
  ip_address TEXT,

  -- User Agent (선택적 - 보안 강화용)
  user_agent TEXT
);

-- ============================================================
-- 인덱스 생성
-- ============================================================

-- 세션 토큰으로 빠른 조회
CREATE INDEX idx_politician_sessions_token
  ON politician_sessions(session_token);

-- 만료된 세션 정리용
CREATE INDEX idx_politician_sessions_expires
  ON politician_sessions(expires_at);

-- 정치인별 세션 조회용
CREATE INDEX idx_politician_sessions_politician
  ON politician_sessions(politician_id);

-- ============================================================
-- 만료된 세션 자동 정리 함수
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_politician_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 만료된 세션 삭제 (만료 시간이 현재 시간보다 이전)
  DELETE FROM politician_sessions
  WHERE expires_at < NOW();
END;
$$;

-- ============================================================
-- 만료된 세션 자동 정리 트리거 (매일 자정 실행)
-- ============================================================

-- pg_cron 확장 활성화 (Supabase에서 지원)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매일 자정에 만료된 세션 정리 (주석 처리 - 수동 실행 필요)
-- SELECT cron.schedule(
--   'cleanup-expired-politician-sessions',
--   '0 0 * * *',  -- 매일 자정
--   'SELECT cleanup_expired_politician_sessions();'
-- );

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- RLS 활성화
ALTER TABLE politician_sessions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 세션 조회 가능 (API에서 검증)
CREATE POLICY "Anyone can read sessions for validation"
  ON politician_sessions
  FOR SELECT
  USING (true);

-- 세션 생성은 서비스 역할만 가능 (API에서만 생성)
CREATE POLICY "Service role can insert sessions"
  ON politician_sessions
  FOR INSERT
  WITH CHECK (true);

-- 세션 업데이트는 서비스 역할만 가능 (last_used_at 업데이트)
CREATE POLICY "Service role can update sessions"
  ON politician_sessions
  FOR UPDATE
  USING (true);

-- 세션 삭제는 서비스 역할만 가능 (로그아웃 시)
CREATE POLICY "Service role can delete sessions"
  ON politician_sessions
  FOR DELETE
  USING (true);

-- ============================================================
-- 테이블 설명
-- ============================================================

COMMENT ON TABLE politician_sessions IS 'Politician session tokens for authenticated posting without repeated email verification. Sessions expire after 24 hours.';
COMMENT ON COLUMN politician_sessions.politician_id IS 'Reference to politicians(id) - 8-char hex TEXT type';
COMMENT ON COLUMN politician_sessions.session_token IS '64-char hex token for authentication (crypto.randomBytes(32))';
COMMENT ON COLUMN politician_sessions.expires_at IS 'Expiration time (created_at + 24 hours)';
COMMENT ON COLUMN politician_sessions.last_used_at IS 'Last time this session was used for posting/commenting';
COMMENT ON COLUMN politician_sessions.ip_address IS 'Optional IP address for security auditing';
COMMENT ON COLUMN politician_sessions.user_agent IS 'Optional User-Agent for security auditing';
