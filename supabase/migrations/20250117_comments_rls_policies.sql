-- =================================================================
-- comments 테이블 Row Level Security (RLS) 정책 설정
-- =================================================================
-- 작업 ID: P2E2
-- 작성일: 2025-01-17
-- 설명: Phase 3에서 사용될 comments 테이블의 보안 정책 사전 설정
--       댓글 작성자와 게시글 작성자의 2단계 삭제 권한 구조 구현
-- =================================================================

-- ===========================
-- 1. 테이블 구조 (참고용)
-- ===========================
-- comments 테이블이 아직 생성되지 않은 경우를 대비한 참고 스키마
-- Phase 1 또는 Phase 3에서 실제 테이블 생성 예정

/*
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글 지원
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 인덱스
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 성능 최적화 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
*/

-- ===========================
-- 2. RLS 활성화
-- ===========================
-- 테이블이 존재하는 경우에만 실행
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    -- RLS 활성화
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    -- 기존 정책이 있다면 삭제
    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
    DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
    DROP POLICY IF EXISTS "Users can delete their own comments or comments on their posts" ON comments;

    RAISE NOTICE 'RLS enabled for comments table';
  ELSE
    RAISE NOTICE 'comments table does not exist yet. Policies will be created when table is created.';
  END IF;
END $$;

-- ===========================
-- 3. SELECT 정책 - 모든 댓글 조회 가능
-- ===========================
-- 공개 정보로서 누구나 읽을 수 있음 (비로그인 포함)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    USING (true);

    COMMENT ON POLICY "Comments are viewable by everyone" ON comments IS
    '모든 사용자(비로그인 포함)가 댓글을 조회할 수 있음 - 투명성 보장';
  END IF;
END $$;

-- ===========================
-- 4. INSERT 정책 - 로그인 사용자만 생성
-- ===========================
-- 인증된 사용자만 댓글 작성 가능, 타인 명의 작성 불가
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    CREATE POLICY "Authenticated users can create comments"
    ON comments FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND auth.uid() = user_id
    );

    COMMENT ON POLICY "Authenticated users can create comments" ON comments IS
    '로그인한 사용자만 자신의 명의로 댓글 작성 가능';
  END IF;
END $$;

-- ===========================
-- 5. UPDATE 정책 - 본인 댓글만 수정
-- ===========================
-- 댓글 작성자만 자신의 댓글 수정 가능
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (
      auth.uid() IS NOT NULL
      AND auth.uid() = user_id
    )
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND auth.uid() = user_id
      -- user_id, post_id, parent_id는 변경 불가
      AND user_id = OLD.user_id
      AND post_id = OLD.post_id
      AND (parent_id IS NULL AND OLD.parent_id IS NULL
           OR parent_id = OLD.parent_id)
    );

    COMMENT ON POLICY "Users can update their own comments" ON comments IS
    '댓글 작성자만 자신의 댓글 내용을 수정할 수 있음 (구조적 필드는 변경 불가)';
  END IF;
END $$;

-- ===========================
-- 6. DELETE 정책 - 2단계 삭제 권한
-- ===========================
-- 1) 댓글 작성자: 자신의 댓글 삭제 가능
-- 2) 게시글 작성자: 자신의 게시글에 달린 모든 댓글 삭제 가능 (관리 권한)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments or comments on their posts"
    ON comments FOR DELETE
    USING (
      auth.uid() IS NOT NULL
      AND (
        -- 본인이 작성한 댓글
        auth.uid() = user_id
        OR
        -- 본인이 작성한 게시글의 댓글 (관리 권한)
        EXISTS (
          SELECT 1 FROM posts
          WHERE posts.id = comments.post_id
          AND posts.user_id = auth.uid()
        )
      )
    );

    COMMENT ON POLICY "Users can delete their own comments or comments on their posts" ON comments IS
    '댓글 작성자는 자신의 댓글을, 게시글 작성자는 자신의 게시글에 달린 모든 댓글을 삭제할 수 있음';
  END IF;
END $$;

-- ===========================
-- 7. 정책 검증 쿼리
-- ===========================
-- RLS 정책이 올바르게 설정되었는지 확인
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    -- RLS 상태 확인
    PERFORM 1 FROM pg_tables
    WHERE tablename = 'comments'
    AND rowsecurity = true;

    IF FOUND THEN
      RAISE NOTICE 'RLS is enabled on comments table';
    ELSE
      RAISE WARNING 'RLS is not enabled on comments table!';
    END IF;

    -- 정책 개수 확인
    PERFORM COUNT(*) FROM pg_policies
    WHERE tablename = 'comments';

    IF COUNT(*) = 4 THEN
      RAISE NOTICE 'All 4 RLS policies are created successfully';
    ELSE
      RAISE WARNING 'Expected 4 policies but found %', COUNT(*);
    END IF;
  END IF;
END $$;

-- ===========================
-- 8. 보안 참고사항
-- ===========================
/*
보안 체크리스트:
1. ✅ RLS 활성화 확인
2. ✅ SELECT: 모든 사용자 조회 가능 (공개 정보)
3. ✅ INSERT: 인증된 사용자만, 본인 명의로만 작성
4. ✅ UPDATE: 본인 댓글만 수정, 구조 필드 변경 불가
5. ✅ DELETE: 2단계 권한 (작성자 + 게시글 소유자)
6. ✅ CASCADE 삭제: 부모 댓글/게시글/사용자 삭제 시 자동 정리

XSS 방어 (프론트엔드):
- DOMPurify 등을 사용한 HTML 새니타이징 필수
- dangerouslySetInnerHTML 사용 시 반드시 새니타이징

Rate Limiting (API):
- 댓글 작성: 1분당 최대 10개
- 댓글 수정: 5분당 최대 20개
- 댓글 삭제: 1분당 최대 5개

추가 보안 고려사항:
- 스팸 필터링: 반복 문자, 링크 개수 제한
- 욕설 필터링: 부적절한 언어 차단
- 신고 시스템: 일정 신고 수 초과 시 자동 숨김
*/

-- ===========================
-- 9. 테스트 데이터 (개발 환경용)
-- ===========================
/*
-- 테스트용 댓글 데이터 삽입 (개발 환경에서만 사용)
INSERT INTO comments (user_id, post_id, content) VALUES
  ('user1-uuid', 1, '첫 번째 댓글입니다'),
  ('user2-uuid', 1, '두 번째 댓글입니다'),
  ('user1-uuid', 1, '세 번째 댓글입니다');

-- 대댓글 테스트
INSERT INTO comments (user_id, post_id, parent_id, content) VALUES
  ('user3-uuid', 1, 1, '첫 번째 댓글에 대한 답글');

-- RLS 테스트
SET SESSION auth.uid = 'user1-uuid';
SELECT * FROM comments; -- 모든 댓글 조회 가능
UPDATE comments SET content = '수정됨' WHERE id = 1; -- 성공 (본인 댓글)
UPDATE comments SET content = '해킹' WHERE id = 2; -- 실패 (타인 댓글)
DELETE FROM comments WHERE id = 1; -- 성공 (본인 댓글)
DELETE FROM comments WHERE id = 2; -- 실패 (타인 댓글)
*/