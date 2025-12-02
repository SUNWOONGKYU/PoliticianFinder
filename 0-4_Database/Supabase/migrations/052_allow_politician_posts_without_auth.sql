-- Migration: 052_allow_politician_posts_without_auth.sql
-- Purpose: 정치인이 인증 없이 글쓰기/댓글 작성 가능하도록 수정
-- Date: 2025-12-02
-- Author: Claude Code
--
-- 변경 사항:
-- 1. posts.user_id NULLABLE로 변경 (정치인 글쓰기 시 NULL 가능)
-- 2. comments.user_id NULLABLE로 변경 (정치인 댓글 시 NULL 가능)
-- 3. CHECK 제약 조건 추가 (user_id 또는 politician_id 중 하나는 반드시 존재)
-- 4. author_type 필드 추가 ('user' 또는 'politician' 구분)
-- 5. posts.title → posts.subject로 필드명 변경 (제목 의미 명확화)

-- ============================================================
-- POSTS 테이블 수정
-- ============================================================

-- 1. title → subject로 필드명 변경 (posts 테이블의 제목 필드)
ALTER TABLE posts
  RENAME COLUMN title TO subject;

-- 2. user_id를 NULLABLE로 변경
ALTER TABLE posts
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. author_type 필드 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- 3. CHECK 제약 조건 추가: user_id 또는 politician_id 중 하나는 반드시 존재
ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (user_id IS NOT NULL OR politician_id IS NOT NULL);

-- 4. 인덱스 추가: author_type별 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_posts_author_type ON posts(author_type);

-- 5. 인덱스 추가: politician_id별 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_posts_politician_id ON posts(politician_id)
  WHERE politician_id IS NOT NULL;

-- ============================================================
-- COMMENTS 테이블 수정
-- ============================================================

-- 1. user_id를 NULLABLE로 변경
ALTER TABLE comments
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. politician_id 필드 추가 (comments 테이블에 없었음)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS politician_id TEXT
  REFERENCES politicians(id) ON DELETE SET NULL;

-- 3. author_type 필드 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- 4. CHECK 제약 조건 추가: user_id 또는 politician_id 중 하나는 반드시 존재
ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (user_id IS NOT NULL OR politician_id IS NOT NULL);

-- 5. 인덱스 추가: author_type별 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_comments_author_type ON comments(author_type);

-- 6. 인덱스 추가: politician_id별 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_comments_politician_id ON comments(politician_id)
  WHERE politician_id IS NOT NULL;

-- ============================================================
-- 기존 데이터 마이그레이션
-- ============================================================

-- 1. 기존 posts 데이터의 author_type 설정
UPDATE posts
  SET author_type = CASE
    WHEN politician_id IS NOT NULL THEN 'politician'
    ELSE 'user'
  END
  WHERE author_type IS NULL;

-- 2. 기존 comments 데이터의 author_type 설정
UPDATE comments
  SET author_type = CASE
    WHEN politician_id IS NOT NULL THEN 'politician'
    ELSE 'user'
  END
  WHERE author_type IS NULL;

-- ============================================================
-- RLS (Row Level Security) 정책 추가
-- ============================================================

-- Posts 테이블: 정치인 본인의 글만 수정/삭제 가능
CREATE POLICY "Politicians can update own posts"
  ON posts
  FOR UPDATE
  USING (
    politician_id IS NOT NULL
    AND politician_id IN (
      SELECT p.id
      FROM politicians p
      JOIN email_verifications ev ON ev.politician_id = p.id
      WHERE ev.verified = true
        AND ev.expires_at > NOW()
    )
  );

CREATE POLICY "Politicians can delete own posts"
  ON posts
  FOR DELETE
  USING (
    politician_id IS NOT NULL
    AND politician_id IN (
      SELECT p.id
      FROM politicians p
      JOIN email_verifications ev ON ev.politician_id = p.id
      WHERE ev.verified = true
        AND ev.expires_at > NOW()
    )
  );

-- Comments 테이블: 정치인 본인의 댓글만 수정/삭제 가능
CREATE POLICY "Politicians can update own comments"
  ON comments
  FOR UPDATE
  USING (
    politician_id IS NOT NULL
    AND politician_id IN (
      SELECT p.id
      FROM politicians p
      JOIN email_verifications ev ON ev.politician_id = p.id
      WHERE ev.verified = true
        AND ev.expires_at > NOW()
    )
  );

CREATE POLICY "Politicians can delete own comments"
  ON comments
  FOR DELETE
  USING (
    politician_id IS NOT NULL
    AND politician_id IN (
      SELECT p.id
      FROM politicians p
      JOIN email_verifications ev ON ev.politician_id = p.id
      WHERE ev.verified = true
        AND ev.expires_at > NOW()
    )
  );

-- ============================================================
-- 완료 메시지
-- ============================================================

-- Migration 완료
COMMENT ON TABLE posts IS 'Posts table - supports both regular users and politicians. Politicians can post without authentication (user_id NULL, politician_id filled).';
COMMENT ON TABLE comments IS 'Comments table - supports both regular users and politicians. Politicians can comment without authentication (user_id NULL, politician_id filled).';
