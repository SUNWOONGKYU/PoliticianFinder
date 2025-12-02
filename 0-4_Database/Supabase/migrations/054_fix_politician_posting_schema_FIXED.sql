-- Migration: 054_fix_politician_posting_schema_FIXED.sql
-- Purpose: 정치인 글쓰기를 위한 posts/comments 테이블 스키마 수정 (수정 버전)
-- NOT NULL 제약조건을 먼저 제거한 후 데이터 정리

-- ============================================================
-- STEP 1: NOT NULL 제약조건 먼저 제거
-- ============================================================

-- 1-1. POSTS 테이블: user_id NULL 허용
ALTER TABLE posts
  ALTER COLUMN user_id DROP NOT NULL;

-- 1-2. COMMENTS 테이블: user_id NULL 허용
ALTER TABLE comments
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================
-- STEP 2: 기존 데이터 정리 (이제 NULL 허용되므로 가능)
-- ============================================================

-- 2-1. posts 테이블: politician_id가 있는 행의 user_id를 NULL로 설정
UPDATE posts
SET user_id = NULL
WHERE politician_id IS NOT NULL;

-- 2-2. comments 테이블: 동일한 정리
UPDATE comments
SET user_id = NULL
WHERE politician_id IS NOT NULL;

-- ============================================================
-- STEP 3: author_type 컬럼 추가 및 설정
-- ============================================================

-- 3-1. POSTS 테이블: author_type 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT;

-- 3-2. 기존 데이터에 author_type 설정
UPDATE posts
SET author_type = CASE
  WHEN politician_id IS NOT NULL THEN 'politician'
  ELSE 'user'
END
WHERE author_type IS NULL;

-- 3-3. author_type을 NOT NULL로 변경 및 DEFAULT 설정
ALTER TABLE posts
  ALTER COLUMN author_type SET NOT NULL;

ALTER TABLE posts
  ALTER COLUMN author_type SET DEFAULT 'user';

-- 3-4. COMMENTS 테이블: author_type 컬럼 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT;

-- 3-5. 기존 데이터에 author_type 설정
UPDATE comments
SET author_type = CASE
  WHEN politician_id IS NOT NULL THEN 'politician'
  ELSE 'user'
END
WHERE author_type IS NULL;

-- 3-6. author_type을 NOT NULL로 변경 및 DEFAULT 설정
ALTER TABLE comments
  ALTER COLUMN author_type SET NOT NULL;

ALTER TABLE comments
  ALTER COLUMN author_type SET DEFAULT 'user';

-- ============================================================
-- STEP 4: CHECK 제약조건 추가
-- ============================================================

-- 4-1. POSTS 테이블: author_type CHECK 제약조건
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_author_type_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_type_check
  CHECK (author_type IN ('user', 'politician'));

-- 4-2. POSTS 테이블: 데이터 무결성 CHECK 제약조건
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_author_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

-- 4-3. COMMENTS 테이블: author_type CHECK 제약조건
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_author_type_check;

ALTER TABLE comments
  ADD CONSTRAINT comments_author_type_check
  CHECK (author_type IN ('user', 'politician'));

-- 4-4. COMMENTS 테이블: 데이터 무결성 CHECK 제약조건
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_author_check;

ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

-- ============================================================
-- STEP 5: 인덱스 추가 (성능 최적화)
-- ============================================================

-- 5-1. 정치인 게시글 조회용
CREATE INDEX IF NOT EXISTS idx_posts_politician_id
  ON posts(politician_id)
  WHERE politician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_politician_id
  ON comments(politician_id)
  WHERE politician_id IS NOT NULL;

-- 5-2. author_type별 조회용
CREATE INDEX IF NOT EXISTS idx_posts_author_type
  ON posts(author_type);

CREATE INDEX IF NOT EXISTS idx_comments_author_type
  ON comments(author_type);

-- ============================================================
-- STEP 6: 테이블 설명 업데이트
-- ============================================================

COMMENT ON COLUMN posts.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN posts.user_id IS 'User ID (NULL for politician posts)';
COMMENT ON COLUMN posts.politician_id IS 'Politician ID (NULL for user posts)';

COMMENT ON COLUMN comments.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN comments.user_id IS 'User ID (NULL for politician comments)';
COMMENT ON COLUMN comments.politician_id IS 'Politician ID (NULL for user comments)';

-- ============================================================
-- 완료!
-- ============================================================
