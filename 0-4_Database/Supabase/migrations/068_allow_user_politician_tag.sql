-- Migration: 068_allow_user_politician_tag.sql
-- Description: 일반 회원이 게시글에 정치인을 태그할 수 있도록 제약 조건 수정
-- Created: 2025-12-17
-- Issue: posts_author_check 제약 조건이 user_id와 politician_id를 동시에 설정하지 못하게 함

-- ============================================================================
-- 1. 기존 제약 조건 삭제
-- ============================================================================
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_author_check;

-- ============================================================================
-- 2. 새로운 제약 조건 추가 (더 유연하게)
-- ============================================================================
-- 규칙:
-- - author_type = 'politician': politician_id 필수, user_id는 선택
-- - author_type = 'user': user_id 필수, politician_id는 선택 (태그용)
-- - author_type = 'anonymous': 둘 다 없어도 됨

ALTER TABLE public.posts
ADD CONSTRAINT posts_author_check CHECK (
  (author_type = 'politician' AND politician_id IS NOT NULL) OR
  (author_type = 'user' AND user_id IS NOT NULL) OR
  (author_type = 'anonymous') OR
  (author_type IS NULL)
);

-- ============================================================================
-- 3. politician_id에 대한 인덱스 추가 (태그된 게시글 검색 성능 향상)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_politician_id_user ON public.posts(politician_id)
WHERE politician_id IS NOT NULL AND user_id IS NOT NULL;

-- ============================================================================
-- 4. 코멘트 추가
-- ============================================================================
COMMENT ON CONSTRAINT posts_author_check ON public.posts IS
'게시글 작성자 유형 검증: politician은 politician_id 필수, user는 user_id 필수 (politician_id 태그 가능)';

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '068: 정치인 태그 기능 활성화 완료' as result;
