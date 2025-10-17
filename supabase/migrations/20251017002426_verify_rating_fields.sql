-- ============================================
-- P2D1 검증: 평가 필드 마이그레이션 검증 쿼리
-- ============================================
-- Phase: Phase 2 - 정치인 목록/상세 (검증)
-- 작성일: 2025-01-17
-- 작성자: fullstack-developer AI
-- 설명: 20251017002426_add_rating_fields_to_politicians.sql 마이그레이션이
--       올바르게 적용되었는지 검증합니다.
-- ============================================

-- ============================================
-- 1. 컬럼 추가 검증
-- ============================================
SELECT '=== COLUMN VERIFICATION ===' AS test_section;

SELECT
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'politicians'
    AND column_name IN ('avg_rating', 'total_ratings')
ORDER BY ordinal_position;

-- 예상 결과:
-- avg_rating: numeric(2,1), default 0.0, nullable YES
-- total_ratings: integer, default 0, nullable YES

-- ============================================
-- 2. 제약조건 검증
-- ============================================
SELECT '=== CONSTRAINT VERIFICATION ===' AS test_section;

SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
    AND rel.relname = 'politicians'
    AND con.conname IN ('check_avg_rating_range', 'check_total_ratings_positive')
ORDER BY con.conname;

-- 예상 결과:
-- check_avg_rating_range: CHECK ((avg_rating >= 0.0) AND (avg_rating <= 5.0))
-- check_total_ratings_positive: CHECK (total_ratings >= 0)

-- ============================================
-- 3. 인덱스 검증
-- ============================================
SELECT '=== INDEX VERIFICATION ===' AS test_section;

SELECT
    indexname,
    indexdef,
    CASE
        WHEN indexdef LIKE '%WHERE%' THEN 'Partial Index'
        ELSE 'Full Index'
    END AS index_type
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'politicians'
    AND indexname IN (
        'idx_politicians_avg_rating',
        'idx_politicians_party_rating',
        'idx_politicians_region_rating'
    )
ORDER BY indexname;

-- 예상 결과: 3개의 인덱스가 생성되어야 함

-- ============================================
-- 4. 제약조건 동작 테스트
-- ============================================
SELECT '=== CONSTRAINT TEST ===' AS test_section;

-- 테스트 1: 유효한 평점 범위 테스트 (성공해야 함)
DO $$
BEGIN
    -- 임시 테스트를 위한 savepoint 생성
    SAVEPOINT test_constraint;

    -- 유효한 값 테스트
    UPDATE politicians
    SET avg_rating = 4.5, total_ratings = 100
    WHERE id = (SELECT id FROM politicians LIMIT 1);

    RAISE NOTICE 'Test 1 PASSED: Valid rating values accepted';

    -- 롤백하여 원래 상태 유지
    ROLLBACK TO SAVEPOINT test_constraint;

EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Test 1 FAILED: Valid values rejected - %', SQLERRM;
        ROLLBACK TO SAVEPOINT test_constraint;
END $$;

-- 테스트 2: 범위 초과 평점 테스트 (실패해야 함)
DO $$
BEGIN
    SAVEPOINT test_constraint;

    -- 범위 초과 값 테스트
    UPDATE politicians
    SET avg_rating = 5.5
    WHERE id = (SELECT id FROM politicians LIMIT 1);

    RAISE NOTICE 'Test 2 FAILED: Invalid rating > 5.0 was accepted';
    ROLLBACK TO SAVEPOINT test_constraint;

EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Test 2 PASSED: Invalid rating > 5.0 correctly rejected';
        ROLLBACK TO SAVEPOINT test_constraint;
END $$;

-- 테스트 3: 음수 평가 개수 테스트 (실패해야 함)
DO $$
BEGIN
    SAVEPOINT test_constraint;

    -- 음수 값 테스트
    UPDATE politicians
    SET total_ratings = -1
    WHERE id = (SELECT id FROM politicians LIMIT 1);

    RAISE NOTICE 'Test 3 FAILED: Negative total_ratings was accepted';
    ROLLBACK TO SAVEPOINT test_constraint;

EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Test 3 PASSED: Negative total_ratings correctly rejected';
        ROLLBACK TO SAVEPOINT test_constraint;
END $$;

-- ============================================
-- 5. 성능 검증 (인덱스 사용 확인)
-- ============================================
SELECT '=== PERFORMANCE VERIFICATION ===' AS test_section;

-- 인덱스 사용 계획 확인
EXPLAIN (COSTS OFF)
SELECT id, name, avg_rating
FROM politicians
WHERE avg_rating > 3.0
ORDER BY avg_rating DESC
LIMIT 10;

-- 복합 인덱스 사용 계획 확인
EXPLAIN (COSTS OFF)
SELECT id, name, avg_rating
FROM politicians
WHERE party = '더불어민주당'
    AND avg_rating > 3.0
ORDER BY avg_rating DESC
LIMIT 10;

-- ============================================
-- 6. 데이터 무결성 검증
-- ============================================
SELECT '=== DATA INTEGRITY VERIFICATION ===' AS test_section;

-- 기본값 확인
SELECT
    COUNT(*) AS total_politicians,
    COUNT(CASE WHEN avg_rating = 0.0 THEN 1 END) AS politicians_with_default_rating,
    COUNT(CASE WHEN total_ratings = 0 THEN 1 END) AS politicians_with_zero_ratings
FROM politicians;

-- 데이터 범위 확인
SELECT
    MIN(avg_rating) AS min_rating,
    MAX(avg_rating) AS max_rating,
    AVG(avg_rating) AS average_rating,
    MIN(total_ratings) AS min_total_ratings,
    MAX(total_ratings) AS max_total_ratings,
    AVG(total_ratings) AS average_total_ratings
FROM politicians;

-- ============================================
-- 7. 샘플 데이터 확인
-- ============================================
SELECT '=== SAMPLE DATA ===' AS test_section;

SELECT
    id,
    name,
    party,
    position,
    avg_rating,
    total_ratings,
    created_at,
    updated_at
FROM politicians
ORDER BY id
LIMIT 5;

-- ============================================
-- 8. 테이블 통계 정보
-- ============================================
SELECT '=== TABLE STATISTICS ===' AS test_section;

SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND tablename = 'politicians';

-- ============================================
-- 9. 종합 검증 결과
-- ============================================
SELECT '=== VERIFICATION SUMMARY ===' AS test_section;

WITH verification_results AS (
    SELECT
        'Columns' AS check_item,
        CASE
            WHEN COUNT(*) = 2 THEN 'PASS'
            ELSE 'FAIL'
        END AS status
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'politicians'
        AND column_name IN ('avg_rating', 'total_ratings')

    UNION ALL

    SELECT
        'Constraints' AS check_item,
        CASE
            WHEN COUNT(*) = 2 THEN 'PASS'
            ELSE 'FAIL'
        END AS status
    FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'politicians'
        AND con.conname IN ('check_avg_rating_range', 'check_total_ratings_positive')

    UNION ALL

    SELECT
        'Indexes' AS check_item,
        CASE
            WHEN COUNT(*) = 3 THEN 'PASS'
            ELSE 'FAIL'
        END AS status
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'politicians'
        AND indexname IN (
            'idx_politicians_avg_rating',
            'idx_politicians_party_rating',
            'idx_politicians_region_rating'
        )
)
SELECT
    check_item,
    status,
    CASE
        WHEN status = 'PASS' THEN '✓'
        ELSE '✗'
    END AS result
FROM verification_results
ORDER BY check_item;

-- ============================================
-- 검증 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'P2D1 Migration Verification Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Please review the results above to ensure:';
    RAISE NOTICE '1. All columns are properly added';
    RAISE NOTICE '2. All constraints are in place';
    RAISE NOTICE '3. All indexes are created';
    RAISE NOTICE '4. Data integrity is maintained';
    RAISE NOTICE '========================================';
END $$;