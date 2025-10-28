-- =================================================================
-- comments 테이블 RLS 정책 롤백 스크립트
-- =================================================================
-- 작업 ID: P2E2 (롤백)
-- 작성일: 2025-01-17
-- 설명: comments 테이블의 RLS 정책을 제거하는 롤백 스크립트
-- =================================================================

-- ===========================
-- 1. 현재 상태 백업 (롤백 전)
-- ===========================
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- 테이블이 존재하는지 확인
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    RAISE NOTICE 'comments table does not exist. Nothing to rollback.';
    RETURN;
  END IF;

  -- 현재 RLS 상태 확인
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'comments'
  AND schemaname = 'public';

  -- 현재 정책 개수 확인
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'comments'
  AND schemaname = 'public';

  RAISE NOTICE 'Current state - RLS enabled: %, Policy count: %',
    v_rls_enabled, v_policy_count;

  -- 백업 정보 기록
  INSERT INTO migration_history (
    migration_name,
    action,
    executed_at,
    metadata
  ) VALUES (
    '20250117_rollback_comments_rls',
    'ROLLBACK_START',
    NOW(),
    jsonb_build_object(
      'rls_enabled', v_rls_enabled,
      'policy_count', v_policy_count
    )
  ) ON CONFLICT DO NOTHING;
END $$;

-- ===========================
-- 2. RLS 정책 제거
-- ===========================
DO $$
DECLARE
  v_policy_name TEXT;
  v_policies_removed INTEGER := 0;
BEGIN
  -- 테이블이 존재하는지 확인
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    RETURN;
  END IF;

  -- DELETE 정책 제거
  DROP POLICY IF EXISTS "Users can delete their own comments or comments on their posts" ON comments;
  IF FOUND THEN
    v_policies_removed := v_policies_removed + 1;
    RAISE NOTICE 'Removed DELETE policy';
  END IF;

  -- UPDATE 정책 제거
  DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
  IF FOUND THEN
    v_policies_removed := v_policies_removed + 1;
    RAISE NOTICE 'Removed UPDATE policy';
  END IF;

  -- INSERT 정책 제거
  DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
  IF FOUND THEN
    v_policies_removed := v_policies_removed + 1;
    RAISE NOTICE 'Removed INSERT policy';
  END IF;

  -- SELECT 정책 제거
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  IF FOUND THEN
    v_policies_removed := v_policies_removed + 1;
    RAISE NOTICE 'Removed SELECT policy';
  END IF;

  RAISE NOTICE 'Total policies removed: %', v_policies_removed;

  -- 다른 정책이 있는지 확인 (경고용)
  FOR v_policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'comments'
    AND schemaname = 'public'
  LOOP
    RAISE WARNING 'Unexpected policy still exists: %', v_policy_name;
  END LOOP;
END $$;

-- ===========================
-- 3. RLS 비활성화 (선택적)
-- ===========================
-- 주의: 프로덕션에서는 RLS를 비활성화하지 않는 것이 안전합니다.
-- 개발/테스트 환경에서만 사용하세요.
DO $$
DECLARE
  v_environment TEXT;
BEGIN
  -- 환경 변수 확인 (실제 구현 시 수정 필요)
  v_environment := current_setting('app.environment', true);

  IF v_environment IN ('development', 'test', 'staging') THEN
    -- 개발/테스트 환경에서만 RLS 비활성화
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'comments'
    ) THEN
      ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
      RAISE NOTICE 'RLS disabled for comments table in % environment', v_environment;
    END IF;
  ELSE
    -- 프로덕션에서는 RLS를 유지
    RAISE NOTICE 'RLS remains enabled in production environment';
  END IF;
END $$;

-- ===========================
-- 4. 롤백 검증
-- ===========================
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- 테이블이 존재하는지 확인
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    RAISE NOTICE 'Rollback verification skipped: comments table does not exist';
    RETURN;
  END IF;

  -- RLS 상태 확인
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'comments'
  AND schemaname = 'public';

  -- 정책 개수 확인
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'comments'
  AND schemaname = 'public';

  -- 검증 결과 출력
  RAISE NOTICE 'Rollback verification:';
  RAISE NOTICE '  - RLS enabled: %', v_rls_enabled;
  RAISE NOTICE '  - Remaining policies: %', v_policy_count;

  IF v_policy_count > 0 THEN
    RAISE WARNING 'Some policies still exist after rollback!';
  ELSE
    RAISE NOTICE 'All policies successfully removed';
  END IF;

  -- 롤백 완료 기록
  INSERT INTO migration_history (
    migration_name,
    action,
    executed_at,
    metadata
  ) VALUES (
    '20250117_rollback_comments_rls',
    'ROLLBACK_COMPLETE',
    NOW(),
    jsonb_build_object(
      'rls_enabled', v_rls_enabled,
      'policy_count', v_policy_count,
      'success', v_policy_count = 0
    )
  ) ON CONFLICT DO NOTHING;
END $$;

-- ===========================
-- 5. 재적용 스크립트 참조
-- ===========================
/*
롤백 후 다시 RLS 정책을 적용하려면:
1. 20250117_comments_rls_policies.sql 스크립트를 실행하세요.
2. 또는 아래 명령을 사용하세요:

-- RLS 재활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 정책 재생성
-- (20250117_comments_rls_policies.sql 참조)
*/

-- ===========================
-- 6. 트러블슈팅 가이드
-- ===========================
/*
문제: 정책이 제거되지 않음
해결:
1. 정책 이름이 변경되었는지 확인:
   SELECT * FROM pg_policies WHERE tablename = 'comments';

2. 수동으로 제거:
   DROP POLICY "<정책이름>" ON comments;

문제: RLS가 비활성화되지 않음
해결:
1. 권한 확인:
   SELECT has_table_privilege(current_user, 'comments', 'ALTER');

2. 수퍼유저로 실행:
   SET ROLE postgres;
   ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
   RESET ROLE;

문제: 롤백 후 앱이 작동하지 않음
해결:
1. RLS를 다시 활성화:
   ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

2. 기본 정책 추가 (임시):
   CREATE POLICY "temp_allow_all" ON comments FOR ALL USING (true);
*/