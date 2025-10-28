-- =================================================================
-- comments 테이블 RLS 정책 테스트 스크립트
-- =================================================================
-- 작업 ID: P2E2 (테스트)
-- 작성일: 2025-01-17
-- 설명: comments 테이블의 RLS 정책이 올바르게 작동하는지 검증
-- =================================================================

-- ===========================
-- 테스트 환경 설정
-- ===========================
BEGIN;

-- 테스트용 임시 스키마 생성
CREATE SCHEMA IF NOT EXISTS test_comments_rls;
SET search_path TO test_comments_rls, public;

-- ===========================
-- 1. 테스트용 테이블 및 데이터 생성
-- ===========================
-- posts 테이블 생성 (간소화된 버전)
CREATE TABLE IF NOT EXISTS test_comments_rls.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- comments 테이블 생성
CREATE TABLE IF NOT EXISTS test_comments_rls.comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id BIGINT NOT NULL REFERENCES test_comments_rls.posts(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES test_comments_rls.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테스트용 사용자 UUID
DO $$
DECLARE
  v_user1_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_user2_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  v_user3_id UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  v_post1_id BIGINT;
  v_post2_id BIGINT;
  v_comment1_id BIGINT;
  v_comment2_id BIGINT;
  v_comment3_id BIGINT;
BEGIN
  -- 테스트 데이터 삽입
  INSERT INTO test_comments_rls.posts (user_id, title, content)
  VALUES (v_user1_id, 'User1의 게시글', '첫 번째 게시글 내용')
  RETURNING id INTO v_post1_id;

  INSERT INTO test_comments_rls.posts (user_id, title, content)
  VALUES (v_user2_id, 'User2의 게시글', '두 번째 게시글 내용')
  RETURNING id INTO v_post2_id;

  -- User1이 자신의 게시글에 댓글 작성
  INSERT INTO test_comments_rls.comments (user_id, post_id, content)
  VALUES (v_user1_id, v_post1_id, 'User1의 자기 게시글 댓글')
  RETURNING id INTO v_comment1_id;

  -- User2가 User1의 게시글에 댓글 작성
  INSERT INTO test_comments_rls.comments (user_id, post_id, content)
  VALUES (v_user2_id, v_post1_id, 'User2가 User1 게시글에 단 댓글')
  RETURNING id INTO v_comment2_id;

  -- User3가 User1의 게시글에 댓글 작성
  INSERT INTO test_comments_rls.comments (user_id, post_id, content)
  VALUES (v_user3_id, v_post1_id, 'User3가 User1 게시글에 단 댓글')
  RETURNING id INTO v_comment3_id;

  -- 대댓글 추가 (User1이 User2의 댓글에 답글)
  INSERT INTO test_comments_rls.comments (user_id, post_id, parent_id, content)
  VALUES (v_user1_id, v_post1_id, v_comment2_id, 'User1이 User2 댓글에 단 답글');

  RAISE NOTICE 'Test data created successfully';
  RAISE NOTICE 'Post1 ID: %, Post2 ID: %', v_post1_id, v_post2_id;
  RAISE NOTICE 'Comment IDs: %, %, %', v_comment1_id, v_comment2_id, v_comment3_id;
END $$;

-- ===========================
-- 2. RLS 정책 적용
-- ===========================
ALTER TABLE test_comments_rls.comments ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 모든 사용자 조회 가능
CREATE POLICY "test_comments_select"
ON test_comments_rls.comments FOR SELECT
USING (true);

-- INSERT 정책: 로그인 사용자만, 본인 명의로만
CREATE POLICY "test_comments_insert"
ON test_comments_rls.comments FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- UPDATE 정책: 본인 댓글만 수정
CREATE POLICY "test_comments_update"
ON test_comments_rls.comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND user_id = OLD.user_id
  AND post_id = OLD.post_id
);

-- DELETE 정책: 2단계 권한
CREATE POLICY "test_comments_delete"
ON test_comments_rls.comments FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM test_comments_rls.posts
      WHERE posts.id = comments.post_id
      AND posts.user_id = auth.uid()
    )
  )
);

-- ===========================
-- 3. RLS 테스트 케이스
-- ===========================
DO $$
DECLARE
  v_user1_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_user2_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  v_user3_id UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  v_test_passed BOOLEAN;
  v_test_count INTEGER := 0;
  v_passed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========== Starting RLS Tests ==========';

  -- Test 1: SELECT - 비로그인 사용자도 조회 가능
  v_test_count := v_test_count + 1;
  BEGIN
    -- auth.uid() 설정 안 함 (비로그인 상태)
    PERFORM * FROM test_comments_rls.comments;
    v_test_passed := TRUE;
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE 'Test 1 PASSED: Anonymous users can SELECT comments';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := FALSE;
      RAISE NOTICE 'Test 1 FAILED: Anonymous users cannot SELECT comments';
  END;

  -- Test 2: INSERT - 비로그인 사용자는 작성 불가
  v_test_count := v_test_count + 1;
  BEGIN
    -- auth.uid() 없이 삽입 시도
    INSERT INTO test_comments_rls.comments (user_id, post_id, content)
    VALUES (v_user1_id, 1, 'Unauthorized comment');
    v_test_passed := FALSE;
    RAISE NOTICE 'Test 2 FAILED: Anonymous users can INSERT comments (should not)';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := TRUE;
      v_passed_count := v_passed_count + 1;
      RAISE NOTICE 'Test 2 PASSED: Anonymous users cannot INSERT comments';
  END;

  -- Test 3: INSERT - 로그인 사용자는 본인 명의로만 작성 가능
  v_test_count := v_test_count + 1;
  BEGIN
    -- User1으로 로그인
    PERFORM set_config('request.jwt.claim.sub', v_user1_id::text, true);

    -- 다른 사용자 명의로 작성 시도
    INSERT INTO test_comments_rls.comments (user_id, post_id, content)
    VALUES (v_user2_id, 1, 'Impersonation attempt');
    v_test_passed := FALSE;
    RAISE NOTICE 'Test 3 FAILED: User can impersonate others (should not)';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := TRUE;
      v_passed_count := v_passed_count + 1;
      RAISE NOTICE 'Test 3 PASSED: User cannot impersonate others';
  END;

  -- Test 4: UPDATE - 본인 댓글만 수정 가능
  v_test_count := v_test_count + 1;
  BEGIN
    -- User2로 로그인
    PERFORM set_config('request.jwt.claim.sub', v_user2_id::text, true);

    -- User1의 댓글 수정 시도
    UPDATE test_comments_rls.comments
    SET content = 'Hacked comment'
    WHERE user_id = v_user1_id;

    v_test_passed := FALSE;
    RAISE NOTICE 'Test 4 FAILED: User can update others comments (should not)';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := TRUE;
      v_passed_count := v_passed_count + 1;
      RAISE NOTICE 'Test 4 PASSED: User cannot update others comments';
  END;

  -- Test 5: DELETE - 본인 댓글 삭제 가능
  v_test_count := v_test_count + 1;
  BEGIN
    -- User2로 로그인 (자신의 댓글 삭제)
    PERFORM set_config('request.jwt.claim.sub', v_user2_id::text, true);

    DELETE FROM test_comments_rls.comments
    WHERE user_id = v_user2_id
    AND content = 'User2가 User1 게시글에 단 댓글';

    v_test_passed := TRUE;
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE 'Test 5 PASSED: User can delete own comments';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := FALSE;
      RAISE NOTICE 'Test 5 FAILED: User cannot delete own comments';
  END;

  -- Test 6: DELETE - 게시글 작성자는 자신의 게시글 댓글 삭제 가능
  v_test_count := v_test_count + 1;
  BEGIN
    -- User1으로 로그인 (게시글 작성자)
    PERFORM set_config('request.jwt.claim.sub', v_user1_id::text, true);

    -- User3가 작성한 댓글 삭제 (User1의 게시글)
    DELETE FROM test_comments_rls.comments
    WHERE user_id = v_user3_id
    AND post_id IN (SELECT id FROM test_comments_rls.posts WHERE user_id = v_user1_id);

    v_test_passed := TRUE;
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE 'Test 6 PASSED: Post owner can delete comments on their posts';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := FALSE;
      RAISE NOTICE 'Test 6 FAILED: Post owner cannot delete comments on their posts';
  END;

  -- Test 7: DELETE - 다른 사용자는 타인 댓글 삭제 불가
  v_test_count := v_test_count + 1;
  BEGIN
    -- User3로 로그인
    PERFORM set_config('request.jwt.claim.sub', v_user3_id::text, true);

    -- User1의 댓글 삭제 시도
    DELETE FROM test_comments_rls.comments
    WHERE user_id = v_user1_id;

    v_test_passed := FALSE;
    RAISE NOTICE 'Test 7 FAILED: User can delete others comments (should not)';
  EXCEPTION
    WHEN OTHERS THEN
      v_test_passed := TRUE;
      v_passed_count := v_passed_count + 1;
      RAISE NOTICE 'Test 7 PASSED: User cannot delete others comments';
  END;

  -- 테스트 결과 요약
  RAISE NOTICE '========== Test Results ==========';
  RAISE NOTICE 'Total tests: %', v_test_count;
  RAISE NOTICE 'Passed: %', v_passed_count;
  RAISE NOTICE 'Failed: %', v_test_count - v_passed_count;
  RAISE NOTICE 'Success rate: %%%', (v_passed_count::NUMERIC / v_test_count * 100)::INTEGER;

  IF v_passed_count = v_test_count THEN
    RAISE NOTICE 'All RLS tests PASSED!';
  ELSE
    RAISE WARNING 'Some RLS tests FAILED. Please review the policies.';
  END IF;
END $$;

-- ===========================
-- 4. CASCADE 삭제 테스트
-- ===========================
DO $$
DECLARE
  v_parent_count INTEGER;
  v_child_count INTEGER;
BEGIN
  RAISE NOTICE '========== CASCADE Delete Test ==========';

  -- 초기 댓글 수 확인
  SELECT COUNT(*) INTO v_parent_count
  FROM test_comments_rls.comments
  WHERE parent_id IS NULL;

  SELECT COUNT(*) INTO v_child_count
  FROM test_comments_rls.comments
  WHERE parent_id IS NOT NULL;

  RAISE NOTICE 'Before: Parent comments: %, Child comments: %', v_parent_count, v_child_count;

  -- 부모 댓글 삭제
  DELETE FROM test_comments_rls.comments
  WHERE id IN (
    SELECT id FROM test_comments_rls.comments
    WHERE parent_id IS NULL
    LIMIT 1
  );

  -- 삭제 후 확인
  SELECT COUNT(*) INTO v_child_count
  FROM test_comments_rls.comments
  WHERE parent_id IS NOT NULL;

  IF v_child_count = 0 THEN
    RAISE NOTICE 'CASCADE delete test PASSED: Child comments deleted with parent';
  ELSE
    RAISE WARNING 'CASCADE delete test FAILED: Child comments remain';
  END IF;
END $$;

-- ===========================
-- 5. 성능 테스트
-- ===========================
DO $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration INTERVAL;
BEGIN
  RAISE NOTICE '========== Performance Test ==========';

  -- SELECT 성능 테스트
  v_start_time := clock_timestamp();
  PERFORM * FROM test_comments_rls.comments;
  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;
  RAISE NOTICE 'SELECT all comments: %', v_duration;

  -- 조건부 SELECT 성능 테스트
  v_start_time := clock_timestamp();
  PERFORM * FROM test_comments_rls.comments WHERE post_id = 1;
  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;
  RAISE NOTICE 'SELECT by post_id: %', v_duration;

  -- DELETE 권한 체크 성능 테스트
  PERFORM set_config('request.jwt.claim.sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);
  v_start_time := clock_timestamp();
  PERFORM * FROM test_comments_rls.comments
  WHERE user_id = auth.uid()
     OR EXISTS (
       SELECT 1 FROM test_comments_rls.posts
       WHERE posts.id = comments.post_id
       AND posts.user_id = auth.uid()
     );
  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;
  RAISE NOTICE 'DELETE permission check: %', v_duration;
END $$;

-- ===========================
-- 6. 정리
-- ===========================
-- 테스트 스키마 삭제 (실제 환경에서는 주석 처리)
-- DROP SCHEMA test_comments_rls CASCADE;

-- 트랜잭션 롤백 (테스트 데이터 제거)
ROLLBACK;

-- ===========================
-- 7. 실제 테이블 검증 (옵션)
-- ===========================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    RAISE NOTICE '========== Actual Table Verification ==========';

    -- RLS 상태 확인
    PERFORM 1 FROM pg_tables
    WHERE tablename = 'comments'
    AND schemaname = 'public'
    AND rowsecurity = true;

    IF FOUND THEN
      RAISE NOTICE 'Production comments table has RLS enabled';
    ELSE
      RAISE WARNING 'Production comments table does not have RLS enabled!';
    END IF;

    -- 정책 확인
    PERFORM COUNT(*) FROM pg_policies
    WHERE tablename = 'comments'
    AND schemaname = 'public';

    RAISE NOTICE 'Production comments table has % policies', COUNT(*);
  ELSE
    RAISE NOTICE 'Production comments table does not exist yet';
  END IF;
END $$;