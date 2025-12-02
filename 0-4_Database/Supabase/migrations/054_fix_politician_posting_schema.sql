-- Migration: 054_fix_politician_posting_schema.sql
-- Purpose: 정치인 글쓰기를 위한 posts/comments 테이블 스키마 수정
-- Date: 2025-12-02
-- Author: Claude Code
--
-- 문제:
-- 1. posts.user_id가 NOT NULL 제약조건으로 정치인 글쓰기 불가능
-- 2. comments.user_id가 NOT NULL 제약조건으로 정치인 댓글쓰기 불가능
-- 3. author_type 컬럼이 없어 일반 사용자와 정치인 구분 불가능
--
-- 해결:
-- 1. user_id NULL 허용 (정치인 게시글은 user_id=NULL, politician_id=NOT NULL)
-- 2. author_type 컬럼 추가 ('user' 또는 'politician')
-- 3. CHECK 제약조건 추가 (user_id와 politician_id 중 하나만 있어야 함)

-- ============================================================
-- 1. POSTS 테이블 수정
-- ============================================================

-- Step 1: user_id NULL 허용
ALTER TABLE posts
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: author_type 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- Step 3: CHECK 제약조건 추가
-- user_id와 politician_id 중 정확히 하나만 있어야 함
ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

-- Step 4: 기존 데이터 업데이트
-- 기존 게시글은 모두 일반 사용자 게시글로 간주
UPDATE posts
SET author_type = 'user'
WHERE author_type IS NULL OR author_type = 'user';

-- ============================================================
-- 2. COMMENTS 테이블 수정
-- ============================================================

-- Step 1: user_id NULL 허용
ALTER TABLE comments
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: author_type 컬럼 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

-- Step 3: CHECK 제약조건 추가
-- user_id와 politician_id 중 정확히 하나만 있어야 함
ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

-- Step 4: 기존 데이터 업데이트
-- 기존 댓글은 모두 일반 사용자 댓글로 간주
UPDATE comments
SET author_type = 'user'
WHERE author_type IS NULL OR author_type = 'user';

-- ============================================================
-- 3. 인덱스 추가 (성능 최적화)
-- ============================================================

-- 정치인 게시글 조회용
CREATE INDEX IF NOT EXISTS idx_posts_politician_id
  ON posts(politician_id)
  WHERE politician_id IS NOT NULL;

-- 정치인 댓글 조회용
CREATE INDEX IF NOT EXISTS idx_comments_politician_id
  ON comments(politician_id)
  WHERE politician_id IS NOT NULL;

-- author_type별 조회용
CREATE INDEX IF NOT EXISTS idx_posts_author_type
  ON posts(author_type);

CREATE INDEX IF NOT EXISTS idx_comments_author_type
  ON comments(author_type);

-- ============================================================
-- 4. 테이블 설명 업데이트
-- ============================================================

COMMENT ON COLUMN posts.author_type IS 'Author type: user (general user) or politician (verified politician)';
COMMENT ON COLUMN posts.user_id IS 'User ID (NULL for politician posts)';
COMMENT ON COLUMN posts.politician_id IS 'Politician ID (NULL for user posts) - 8-char hex TEXT type';

COMMENT ON COLUMN comments.author_type IS 'Author type: user (general user) or politician (verified politician)';
COMMENT ON COLUMN comments.user_id IS 'User ID (NULL for politician comments)';
COMMENT ON COLUMN comments.politician_id IS 'Politician ID (NULL for user comments) - 8-char hex TEXT type';

-- ============================================================
-- 5. 검증 쿼리 (주석 처리 - 수동 실행용)
-- ============================================================

-- 정치인 게시글 예시 조회
-- SELECT p.*, pol.name AS politician_name
-- FROM posts p
-- LEFT JOIN politicians pol ON p.politician_id = pol.id
-- WHERE p.author_type = 'politician'
-- LIMIT 10;

-- 일반 사용자 게시글 예시 조회
-- SELECT p.*, u.email AS user_email
-- FROM posts p
-- LEFT JOIN users u ON p.user_id = u.id
-- WHERE p.author_type = 'user'
-- LIMIT 10;

-- ============================================================
-- 완료!
-- ============================================================

-- 이제 다음과 같이 정치인 게시글을 작성할 수 있습니다:
-- INSERT INTO posts (user_id, politician_id, title, content, category, author_type)
-- VALUES (NULL, '62e7b453', '제목', '내용', '정책발표', 'politician');

-- 일반 사용자 게시글:
-- INSERT INTO posts (user_id, politician_id, title, content, category, author_type)
-- VALUES ('user-uuid', NULL, '제목', '내용', '자유', 'user');
