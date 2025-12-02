-- ============================================================
-- Migration 052 + 053 + 054 통합 실행 스크립트
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- Migration 052: Allow politician posts without auth
-- ============================================================

-- 0. politicians 테이블에 verified_email 필드 추가
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS verified_email TEXT UNIQUE;

ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN politicians.verified_email IS '정치인이 인증한 이메일 주소 (글쓰기 계정으로 사용)';
COMMENT ON COLUMN politicians.email_verified_at IS '이메일 최초 인증 완료 시간';

-- ============================================================
-- Migration 052: Allow politician posts without auth (계속)
-- ============================================================

-- 1. posts.title → subject로 변경
ALTER TABLE posts RENAME COLUMN title TO subject;

-- 2. posts.user_id → NULLABLE
ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;

-- 3. posts.author_type 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- 4. posts CHECK 제약 조건
ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (user_id IS NOT NULL OR politician_id IS NOT NULL);

-- 5. posts 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_author_type ON posts(author_type);
CREATE INDEX IF NOT EXISTS idx_posts_politician_id ON posts(politician_id) WHERE politician_id IS NOT NULL;

-- 6. comments.user_id → NULLABLE
ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;

-- 7. comments.politician_id 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS politician_id TEXT
  REFERENCES politicians(id) ON DELETE SET NULL;

-- 8. comments.author_type 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- 9. comments CHECK 제약 조건
ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (user_id IS NOT NULL OR politician_id IS NOT NULL);

-- 10. comments 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_author_type ON comments(author_type);
CREATE INDEX IF NOT EXISTS idx_comments_politician_id ON comments(politician_id) WHERE politician_id IS NOT NULL;

-- 11. 기존 데이터 author_type 설정
UPDATE posts
  SET author_type = CASE
    WHEN politician_id IS NOT NULL THEN 'politician'
    ELSE 'user'
  END
  WHERE author_type IS NULL;

UPDATE comments
  SET author_type = CASE
    WHEN politician_id IS NOT NULL THEN 'politician'
    ELSE 'user'
  END
  WHERE author_type IS NULL;

-- ============================================================
-- Migration 053: Create politician_sessions table
-- ============================================================

-- 1. politician_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS politician_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_politician_sessions_token
  ON politician_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_expires
  ON politician_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_politician
  ON politician_sessions(politician_id);

-- 3. RLS 활성화
ALTER TABLE politician_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (조회)
CREATE POLICY "Anyone can read sessions for validation"
  ON politician_sessions
  FOR SELECT
  USING (true);

-- 5. RLS 정책 (삽입)
CREATE POLICY "Service role can insert sessions"
  ON politician_sessions
  FOR INSERT
  WITH CHECK (true);

-- 6. RLS 정책 (업데이트)
CREATE POLICY "Service role can update sessions"
  ON politician_sessions
  FOR UPDATE
  USING (true);

-- 7. RLS 정책 (삭제)
CREATE POLICY "Service role can delete sessions"
  ON politician_sessions
  FOR DELETE
  USING (true);

-- 8. 테이블 설명
COMMENT ON TABLE politician_sessions IS 'Politician session tokens for authenticated posting without repeated email verification. Sessions are permanent (expire 2099-12-31).';
COMMENT ON COLUMN politician_sessions.politician_id IS 'Reference to politicians(id) - 8-char hex TEXT type';
COMMENT ON COLUMN politician_sessions.session_token IS '64-char hex token for authentication (crypto.randomBytes(32))';
COMMENT ON COLUMN politician_sessions.expires_at IS 'Expiration time (2099-12-31 - permanent session)';

-- ============================================================
-- 완료 메시지
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 052 + 053 completed successfully!';
END $$;
