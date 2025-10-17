-- ============================================
-- P2D1 성능 테스트: 평가 필드 인덱스 성능 검증
-- ============================================
-- Phase: Phase 2 - 정치인 목록/상세 (성능 테스트)
-- 작성일: 2025-01-17
-- 작성자: fullstack-developer AI
-- 설명: 평가 필드 관련 인덱스의 성능을 측정하고 최적화 상태를 확인합니다.
-- ============================================

-- 성능 측정을 위한 설정
SET work_mem = '256MB';  -- 정렬 작업을 위한 메모리 증가
SET random_page_cost = 1.1;  -- SSD 환경 최적화

-- ============================================
-- 1. 테스트 데이터 생성 (필요한 경우)
-- ============================================
SELECT '=== TEST DATA GENERATION ===' AS test_section;

-- 테스트용 임시 테이블 생성 (실제 데이터가 충분하지 않은 경우)
DO $$
DECLARE
    politician_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO politician_count FROM politicians;

    IF politician_count < 100 THEN
        RAISE NOTICE 'Current politician count: %. Generating test data...', politician_count;

        -- 테스트 데이터 생성 (실제 운영에서는 실행하지 마세요)
        /*
        INSERT INTO politicians (
            name, party, region, position,
            avg_rating, total_ratings
        )
        SELECT
            'Test Politician ' || generate_series,
            CASE (random() * 5)::int
                WHEN 0 THEN '더불어민주당'
                WHEN 1 THEN '국민의힘'
                WHEN 2 THEN '정의당'
                WHEN 3 THEN '개혁신당'
                WHEN 4 THEN '무소속'
                ELSE '기타'
            END,
            '서울특별시',
            '국회의원',
            ROUND((random() * 5)::numeric, 1),  -- 0.0 ~ 5.0
            (random() * 1000)::int  -- 0 ~ 1000
        FROM generate_series(1, 1000);
        */

        RAISE NOTICE 'Test data generation skipped (uncomment to enable)';
    ELSE
        RAISE NOTICE 'Sufficient data exists: % politicians', politician_count;
    END IF;
END $$;

-- ============================================
-- 2. 인덱스 사용 통계 초기화
-- ============================================
SELECT '=== INDEX STATISTICS RESET ===' AS test_section;

-- 통계 수집 활성화 확인
SHOW track_io_timing;

-- 인덱스 사용 통계 조회 (초기 상태)
SELECT
    schemaname,
    indexrelname AS index_name,
    idx_scan AS scans_before,
    idx_tup_read AS tuples_read_before,
    idx_tup_fetch AS tuples_fetched_before
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename = 'politicians'
    AND indexrelname LIKE '%rating%'
ORDER BY indexrelname;

-- ============================================
-- 3. 쿼리 성능 테스트
-- ============================================
SELECT '=== QUERY PERFORMANCE TESTS ===' AS test_section;

-- 테스트 1: 평점 기준 정렬 (idx_politicians_avg_rating)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, name, party, avg_rating, total_ratings
FROM politicians
WHERE avg_rating > 0
ORDER BY avg_rating DESC
LIMIT 20;

-- 테스트 2: 정당별 평점 정렬 (idx_politicians_party_rating)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, name, party, avg_rating
FROM politicians
WHERE party = '더불어민주당'
    AND avg_rating > 0
ORDER BY avg_rating DESC
LIMIT 10;

-- 테스트 3: 지역별 평점 정렬 (idx_politicians_region_rating)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, name, region, avg_rating
FROM politicians
WHERE region = '서울특별시'
    AND avg_rating > 0
ORDER BY avg_rating DESC
LIMIT 10;

-- 테스트 4: 복합 조건 쿼리
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT
    p.party,
    COUNT(*) AS politician_count,
    AVG(p.avg_rating) AS average_rating,
    MAX(p.avg_rating) AS max_rating,
    MIN(p.avg_rating) AS min_rating
FROM politicians p
WHERE p.avg_rating > 0
GROUP BY p.party
ORDER BY average_rating DESC;

-- 테스트 5: 페이지네이션 쿼리
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, name, party, avg_rating, total_ratings
FROM politicians
WHERE avg_rating > 3.0
ORDER BY avg_rating DESC, id ASC
OFFSET 20 LIMIT 10;

-- ============================================
-- 4. 인덱스 효율성 분석
-- ============================================
SELECT '=== INDEX EFFICIENCY ANALYSIS ===' AS test_section;

-- 인덱스 크기 및 블로트 확인
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS number_of_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE
        WHEN idx_scan > 0 THEN
            ROUND((idx_tup_fetch::numeric / idx_scan), 2)
        ELSE 0
    END AS avg_tuples_per_scan
FROM pg_stat_user_indexes
    JOIN pg_indexes USING (schemaname, indexname)
WHERE schemaname = 'public'
    AND tablename = 'politicians'
    AND indexname LIKE '%rating%'
ORDER BY idx_scan DESC;

-- 인덱스 선택성 (Selectivity) 분석
WITH index_selectivity AS (
    SELECT
        'idx_politicians_avg_rating' AS index_name,
        COUNT(DISTINCT avg_rating) AS distinct_values,
        COUNT(*) AS total_rows,
        ROUND(COUNT(DISTINCT avg_rating)::numeric / COUNT(*) * 100, 2) AS selectivity_pct
    FROM politicians
    WHERE avg_rating > 0

    UNION ALL

    SELECT
        'idx_politicians_party_rating' AS index_name,
        COUNT(DISTINCT (party, avg_rating)) AS distinct_values,
        COUNT(*) AS total_rows,
        ROUND(COUNT(DISTINCT (party, avg_rating))::numeric / COUNT(*) * 100, 2) AS selectivity_pct
    FROM politicians
    WHERE avg_rating > 0

    UNION ALL

    SELECT
        'idx_politicians_region_rating' AS index_name,
        COUNT(DISTINCT (region, avg_rating)) AS distinct_values,
        COUNT(*) AS total_rows,
        ROUND(COUNT(DISTINCT (region, avg_rating))::numeric / COUNT(*) * 100, 2) AS selectivity_pct
    FROM politicians
    WHERE avg_rating > 0
)
SELECT
    index_name,
    distinct_values,
    total_rows,
    selectivity_pct || '%' AS selectivity,
    CASE
        WHEN selectivity_pct > 95 THEN 'Excellent'
        WHEN selectivity_pct > 70 THEN 'Good'
        WHEN selectivity_pct > 30 THEN 'Fair'
        ELSE 'Poor'
    END AS selectivity_rating
FROM index_selectivity
ORDER BY selectivity_pct DESC;

-- ============================================
-- 5. 캐시 히트율 분석
-- ============================================
SELECT '=== CACHE HIT RATIO ===' AS test_section;

SELECT
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE
        WHEN (heap_blks_read + heap_blks_hit) > 0 THEN
            ROUND((heap_blks_hit::numeric / (heap_blks_read + heap_blks_hit) * 100), 2)
        ELSE 0
    END AS cache_hit_ratio,
    idx_blks_read,
    idx_blks_hit,
    CASE
        WHEN (idx_blks_read + idx_blks_hit) > 0 THEN
            ROUND((idx_blks_hit::numeric / (idx_blks_read + idx_blks_hit) * 100), 2)
        ELSE 0
    END AS index_cache_hit_ratio
FROM pg_statio_user_tables
WHERE schemaname = 'public'
    AND tablename = 'politicians';

-- ============================================
-- 6. 실행 시간 벤치마크
-- ============================================
SELECT '=== EXECUTION TIME BENCHMARK ===' AS test_section;

-- 벤치마크 함수
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
    rec RECORD;
BEGIN
    RAISE NOTICE '--- Starting performance benchmark ---';

    -- 테스트 1: 인덱스 없는 쿼리 시뮬레이션
    start_time := clock_timestamp();
    FOR rec IN
        SELECT id FROM politicians
        WHERE CAST(avg_rating AS TEXT) > '3.0'  -- 인덱스를 우회하는 조건
        ORDER BY avg_rating DESC
        LIMIT 100
    LOOP
        -- 결과 소비
    END LOOP;
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    RAISE NOTICE 'Without index (simulated): %ms',
        EXTRACT(MILLISECONDS FROM execution_time);

    -- 테스트 2: 인덱스 있는 쿼리
    start_time := clock_timestamp();
    FOR rec IN
        SELECT id FROM politicians
        WHERE avg_rating > 3.0  -- 인덱스 사용
        ORDER BY avg_rating DESC
        LIMIT 100
    LOOP
        -- 결과 소비
    END LOOP;
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    RAISE NOTICE 'With index: %ms',
        EXTRACT(MILLISECONDS FROM execution_time);

    -- 테스트 3: 복합 인덱스 활용
    start_time := clock_timestamp();
    FOR rec IN
        SELECT id FROM politicians
        WHERE party = '더불어민주당' AND avg_rating > 3.0
        ORDER BY avg_rating DESC
        LIMIT 50
    LOOP
        -- 결과 소비
    END LOOP;
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    RAISE NOTICE 'Composite index query: %ms',
        EXTRACT(MILLISECONDS FROM execution_time);

    RAISE NOTICE '--- Benchmark completed ---';
END $$;

-- ============================================
-- 7. 권장사항 생성
-- ============================================
SELECT '=== OPTIMIZATION RECOMMENDATIONS ===' AS test_section;

WITH index_usage AS (
    SELECT
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
        AND tablename = 'politicians'
        AND indexrelname LIKE '%rating%'
)
SELECT
    CASE
        WHEN idx_scan = 0 THEN
            'WARNING: Index "' || indexrelname || '" has never been used. Consider removing it.'
        WHEN idx_scan < 10 THEN
            'INFO: Index "' || indexrelname || '" has low usage (' || idx_scan || ' scans).'
        ELSE
            'OK: Index "' || indexrelname || '" is actively used (' || idx_scan || ' scans).'
    END AS recommendation
FROM index_usage
ORDER BY idx_scan;

-- ============================================
-- 8. 자동 VACUUM 상태 확인
-- ============================================
SELECT '=== AUTOVACUUM STATUS ===' AS test_section;

SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND tablename = 'politicians';

-- ============================================
-- 9. 성능 요약 보고서
-- ============================================
SELECT '=== PERFORMANCE SUMMARY REPORT ===' AS test_section;

DO $$
DECLARE
    total_politicians INTEGER;
    indexed_politicians INTEGER;
    avg_rating_variance NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_politicians FROM politicians;
    SELECT COUNT(*) INTO indexed_politicians FROM politicians WHERE avg_rating > 0;
    SELECT VARIANCE(avg_rating) INTO avg_rating_variance FROM politicians WHERE avg_rating > 0;

    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'P2D1 Performance Test Summary';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total Politicians: %', total_politicians;
    RAISE NOTICE 'Politicians with ratings: %', indexed_politicians;
    RAISE NOTICE 'Index Coverage: %%%',
        CASE WHEN total_politicians > 0
            THEN ROUND(indexed_politicians::numeric / total_politicians * 100, 2)
            ELSE 0
        END;
    RAISE NOTICE 'Rating Variance: %', ROUND(avg_rating_variance, 3);
    RAISE NOTICE '';
    RAISE NOTICE 'Index Performance:';
    RAISE NOTICE '- Partial indexes reduce storage overhead';
    RAISE NOTICE '- Composite indexes optimize filter+sort operations';
    RAISE NOTICE '- Index-only scans possible for covered queries';
    RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- 테스트 완료
-- ============================================
SELECT '=== TEST COMPLETED ===' AS test_section;
SELECT NOW() AS test_completion_time;