-- ============================================================
-- 전체 마이그레이션 통합 스크립트 (최종 버전)
-- Migration 053 + Migration 054 (FIXED)
-- Supabase SQL Editor에 이 파일 전체를 복사-붙여넣기-실행
-- ============================================================

-- ============================================================
-- Migration 053: politician_sessions 테이블 생성
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_politician_sessions_token
  ON politician_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_expires
  ON politician_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_politician
  ON politician_sessions(politician_id);

CREATE OR REPLACE FUNCTION cleanup_expired_politician_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM politician_sessions
  WHERE expires_at < NOW();
END;
$$;

ALTER TABLE politician_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read sessions for validation" ON politician_sessions;
CREATE POLICY "Anyone can read sessions for validation"
  ON politician_sessions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert sessions" ON politician_sessions;
CREATE POLICY "Service role can insert sessions"
  ON politician_sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update sessions" ON politician_sessions;
CREATE POLICY "Service role can update sessions"
  ON politician_sessions
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Service role can delete sessions" ON politician_sessions;
CREATE POLICY "Service role can delete sessions"
  ON politician_sessions
  FOR DELETE
  USING (true);

COMMENT ON TABLE politician_sessions IS 'Politician session tokens for authenticated posting';
COMMENT ON COLUMN politician_sessions.politician_id IS 'Reference to politicians(id) - 8-char hex TEXT type';
COMMENT ON COLUMN politician_sessions.session_token IS '64-char hex token for authentication';

-- ============================================================
-- Migration 054: posts/comments 스키마 수정 (최종 수정 버전)
-- ============================================================

-- STEP 1: NOT NULL 제약조건 먼저 제거
ALTER TABLE posts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE comments
  ALTER COLUMN user_id DROP NOT NULL;

-- STEP 2: 기존 데이터 정리 (이제 NULL 허용되므로 가능)
UPDATE posts
SET user_id = NULL
WHERE politician_id IS NOT NULL;

UPDATE comments
SET user_id = NULL
WHERE politician_id IS NOT NULL;

-- STEP 3: author_type 컬럼 추가 및 설정
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT;

UPDATE posts
SET author_type = CASE
  WHEN politician_id IS NOT NULL THEN 'politician'
  ELSE 'user'
END
WHERE author_type IS NULL;

ALTER TABLE posts
  ALTER COLUMN author_type SET NOT NULL;

ALTER TABLE posts
  ALTER COLUMN author_type SET DEFAULT 'user';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT;

UPDATE comments
SET author_type = CASE
  WHEN politician_id IS NOT NULL THEN 'politician'
  ELSE 'user'
END
WHERE author_type IS NULL;

ALTER TABLE comments
  ALTER COLUMN author_type SET NOT NULL;

ALTER TABLE comments
  ALTER COLUMN author_type SET DEFAULT 'user';

-- STEP 4: CHECK 제약조건 추가
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_author_type_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_type_check
  CHECK (author_type IN ('user', 'politician'));

ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_author_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_author_type_check;

ALTER TABLE comments
  ADD CONSTRAINT comments_author_type_check
  CHECK (author_type IN ('user', 'politician'));

ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_author_check;

ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

-- STEP 5: 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_posts_politician_id
  ON posts(politician_id)
  WHERE politician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_politician_id
  ON comments(politician_id)
  WHERE politician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_type
  ON posts(author_type);

CREATE INDEX IF NOT EXISTS idx_comments_author_type
  ON comments(author_type);

-- STEP 6: 테이블 설명 업데이트
COMMENT ON COLUMN posts.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN posts.user_id IS 'User ID (NULL for politician posts)';
COMMENT ON COLUMN posts.politician_id IS 'Politician ID (NULL for user posts)';

COMMENT ON COLUMN comments.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN comments.user_id IS 'User ID (NULL for politician comments)';
COMMENT ON COLUMN comments.politician_id IS 'Politician ID (NULL for user comments)';

-- ============================================================
-- 완료!
-- ============================================================

-- 검증 쿼리 (선택적 실행)
-- SELECT COUNT(*) as session_count FROM politician_sessions;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('user_id', 'author_type', 'politician_id');
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'comments' AND column_name IN ('user_id', 'author_type', 'politician_id');
