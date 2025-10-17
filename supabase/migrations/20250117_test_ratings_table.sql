-- P2D2: ratings 테이블 테스트 스크립트
-- 테이블 생성 후 제약조건 및 기능 검증
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 1. 테이블 구조 확인
-- ============================================

-- 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'ratings'
) AS table_exists;

-- 컬럼 정보 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ratings'
ORDER BY ordinal_position;

-- ============================================
-- 2. 제약조건 확인
-- ============================================

-- 모든 제약조건 목록
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'ratings'
ORDER BY constraint_type, constraint_name;

-- CHECK 제약조건 상세
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN (
  SELECT constraint_name
  FROM information_schema.table_constraints
  WHERE table_name = 'ratings'
  AND constraint_type = 'CHECK'
);

-- UNIQUE 제약조건 확인
SELECT
  constraint_name,
  column_name
FROM information_schema.constraint_column_usage
WHERE constraint_name = 'unique_user_politician';

-- ============================================
-- 3. 인덱스 확인
-- ============================================

-- 생성된 인덱스 목록
SELECT
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'ratings'
ORDER BY indexname;

-- 인덱스 사용 통계 (초기값)
SELECT
  schemaname,
  tablename,
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'ratings';

-- ============================================
-- 4. 트리거 확인
-- ============================================

-- 트리거 목록
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'ratings';

-- ============================================
-- 5. 기능 테스트 (트랜잭션으로 롤백)
-- ============================================

BEGIN;

-- 테스트 데이터 삽입
DO $$
DECLARE
  test_user_id1 UUID := '550e8400-e29b-41d4-a716-446655440000';
  test_user_id2 UUID := '550e8400-e29b-41d4-a716-446655440001';
  inserted_id BIGINT;
  updated_time TIMESTAMPTZ;
  original_time TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '=== 테스트 시작 ===';

  -- 5.1. 정상 INSERT 테스트
  INSERT INTO ratings (user_id, politician_id, score, comment, category)
  VALUES (test_user_id1, 1, 5, '훌륭한 정치인입니다.', 'overall')
  RETURNING id, created_at INTO inserted_id, original_time;

  RAISE NOTICE '✅ INSERT 성공: ID = %', inserted_id;

  -- 5.2. UPDATE 및 트리거 테스트
  PERFORM pg_sleep(1); -- 1초 대기 (updated_at 변경 확인용)

  UPDATE ratings
  SET score = 4, comment = '수정된 평가입니다.'
  WHERE id = inserted_id
  RETURNING updated_at INTO updated_time;

  IF updated_time > original_time THEN
    RAISE NOTICE '✅ updated_at 트리거 동작 확인';
  ELSE
    RAISE WARNING '❌ updated_at 트리거 미동작';
  END IF;

  -- 5.3. 1인 1평가 제약 테스트 (실패 예상)
  BEGIN
    INSERT INTO ratings (user_id, politician_id, score)
    VALUES (test_user_id1, 1, 3);
    RAISE WARNING '❌ 1인 1평가 제약이 작동하지 않음';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '✅ 1인 1평가 제약 확인 (중복 방지 성공)';
  END;

  -- 5.4. 평점 범위 제약 테스트 (실패 예상)
  BEGIN
    INSERT INTO ratings (user_id, politician_id, score)
    VALUES (test_user_id2, 2, 6);
    RAISE WARNING '❌ 평점 범위 제약이 작동하지 않음';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ 평점 범위 제약 확인 (1-5 범위 강제)';
  END;

  -- 5.5. 평점 범위 제약 테스트 - 0점 (실패 예상)
  BEGIN
    INSERT INTO ratings (user_id, politician_id, score)
    VALUES (test_user_id2, 2, 0);
    RAISE WARNING '❌ 평점 범위 제약이 작동하지 않음 (0점)';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ 평점 범위 제약 확인 (0점 방지)';
  END;

  -- 5.6. 코멘트 길이 제약 테스트 (실패 예상)
  DECLARE
    long_comment TEXT;
  BEGIN
    -- 1001자 코멘트 생성
    long_comment := REPEAT('가', 1001);

    INSERT INTO ratings (user_id, politician_id, score, comment)
    VALUES (test_user_id2, 3, 3, long_comment);
    RAISE WARNING '❌ 코멘트 길이 제약이 작동하지 않음';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ 코멘트 길이 제약 확인 (1000자 제한)';
  END;

  -- 5.7. NULL 코멘트 허용 테스트
  INSERT INTO ratings (user_id, politician_id, score)
  VALUES (test_user_id2, 2, 4);
  RAISE NOTICE '✅ NULL 코멘트 허용 확인';

  -- 5.8. 카테고리 기본값 테스트
  INSERT INTO ratings (user_id, politician_id, score, comment)
  VALUES (test_user_id2, 3, 3, '카테고리 미지정')
  RETURNING category INTO original_time; -- 변수 재사용

  IF original_time::text = 'overall' THEN
    RAISE NOTICE '✅ 카테고리 기본값 (overall) 확인';
  ELSE
    RAISE WARNING '❌ 카테고리 기본값 설정 실패';
  END IF;

  RAISE NOTICE '=== 테스트 완료 ===';
END;
$$;

-- 트랜잭션 롤백 (테스트 데이터 제거)
ROLLBACK;

-- ============================================
-- 6. 성능 테스트용 쿼리 플랜
-- ============================================

-- 정치인별 평가 조회 쿼리 플랜
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM ratings
WHERE politician_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- 사용자별 평가 조회 쿼리 플랜
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM ratings
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;

-- 평점 통계 집계 쿼리 플랜
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  politician_id,
  COUNT(*) as total_ratings,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score
FROM ratings
WHERE politician_id = 1
GROUP BY politician_id;

-- ============================================
-- 7. 테스트 결과 요약
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  constraint_count INTEGER;
  index_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- 집계
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'ratings';

  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_name = 'ratings';

  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'ratings';

  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'ratings';

  -- 결과 출력
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 ratings 테이블 테스트 결과 요약';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 테이블 생성: %', CASE WHEN table_count = 1 THEN '성공' ELSE '실패' END;
  RAISE NOTICE '✅ 제약조건 개수: %', constraint_count;
  RAISE NOTICE '✅ 인덱스 개수: %', index_count;
  RAISE NOTICE '✅ 트리거 개수: %', trigger_count;
  RAISE NOTICE '========================================';

  -- 상세 권장사항
  IF index_count < 5 THEN
    RAISE WARNING '⚠️ 인덱스가 5개 미만입니다. 추가 인덱스 생성을 확인하세요.';
  END IF;

  IF trigger_count = 0 THEN
    RAISE WARNING '⚠️ updated_at 트리거가 없습니다.';
  END IF;
END;
$$;