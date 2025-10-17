-- P2D3: 평가 인덱스 성능 테스트
-- ratings 테이블의 인덱스 성능 측정 및 검증
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 1. 테스트 데이터 생성 (개발 환경에서만 실행)
-- ============================================

-- 테스트 데이터가 없는 경우를 위한 샘플 데이터 (선택적)
-- 프로덕션에서는 실행하지 마세요!
/*
INSERT INTO ratings (politician_id, user_id, category, score, comment, created_at)
SELECT
    (RANDOM() * 100)::INT + 1 AS politician_id,
    gen_random_uuid() AS user_id,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'overall'
        WHEN 1 THEN 'economy'
        WHEN 2 THEN 'welfare'
        WHEN 3 THEN 'foreign_policy'
        ELSE 'education'
    END AS category,
    (RANDOM() * 4 + 1)::INT AS score,
    CASE
        WHEN RANDOM() < 0.3 THEN NULL
        ELSE '테스트 코멘트 ' || generate_series
    END AS comment,
    NOW() - (RANDOM() * INTERVAL '2 years') AS created_at
FROM generate_series(1, 10000);
*/

-- ============================================
-- 2. 인덱스 성능 테스트 쿼리
-- ============================================

-- 테스트 시작
DO $$
BEGIN
    RAISE NOTICE '===== P2D3 인덱스 성능 테스트 시작 =====';
    RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- --------------------------------------------
-- Test 1: 기본 조회 (politician_id)
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- --------------------------------------------
-- Test 2: 복합 인덱스 테스트 (politician_id + category)
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
    AND category = 'overall'
ORDER BY created_at DESC
LIMIT 10;

-- --------------------------------------------
-- Test 3: 사용자 + 카테고리 복합 인덱스
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE user_id = (SELECT user_id FROM ratings LIMIT 1)
    AND category = 'economy'
LIMIT 10;

-- --------------------------------------------
-- Test 4: 고평점 부분 인덱스 테스트
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
    AND score >= 4
ORDER BY created_at DESC
LIMIT 10;

-- --------------------------------------------
-- Test 5: 최근 1년 부분 인덱스 테스트
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
    AND created_at > NOW() - INTERVAL '1 year'
ORDER BY created_at DESC
LIMIT 10;

-- --------------------------------------------
-- Test 6: 코멘트 있는 평가 부분 인덱스
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
    AND comment IS NOT NULL
    AND LENGTH(comment) > 0
ORDER BY created_at DESC
LIMIT 10;

-- --------------------------------------------
-- Test 7: 코멘트 전문 검색 (GIN 인덱스)
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE politician_id = 1
    AND comment ILIKE '%정책%'
LIMIT 10;

-- 더 효율적인 GIN 검색
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM ratings
WHERE comment % '정책'  -- pg_trgm similarity search
LIMIT 10;

-- --------------------------------------------
-- Test 8: 월별 집계 표현식 인덱스
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    DATE_TRUNC('month', created_at) AS month,
    AVG(score) AS avg_score,
    COUNT(*) AS count
FROM ratings
WHERE politician_id = 1
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- --------------------------------------------
-- Test 9: 연도별 집계 표현식 인덱스
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    EXTRACT(YEAR FROM created_at) AS year,
    AVG(score) AS avg_score,
    COUNT(*) AS count
FROM ratings
WHERE politician_id = 1
GROUP BY EXTRACT(YEAR FROM created_at)
ORDER BY year DESC;

-- --------------------------------------------
-- Test 10: 복잡한 조합 쿼리
-- --------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    r.*,
    COUNT(*) OVER (PARTITION BY r.politician_id) as total_ratings
FROM ratings r
WHERE r.politician_id IN (1, 2, 3)
    AND r.score >= 3
    AND r.created_at > NOW() - INTERVAL '6 months'
    AND r.comment IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 20;

-- ============================================
-- 3. 인덱스 사용률 통계
-- ============================================

-- 인덱스 사용 통계 확인
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END AS usage_level
FROM pg_stat_user_indexes
WHERE tablename = 'ratings'
ORDER BY idx_scan DESC;

-- ============================================
-- 4. 인덱스 크기 및 효율성 분석
-- ============================================

-- 인덱스 크기 확인
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
    pg_size_pretty(pg_total_relation_size(indexname::regclass)) AS total_size
FROM pg_indexes
WHERE tablename = 'ratings'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 테이블 대비 인덱스 크기 비율
WITH table_size AS (
    SELECT pg_relation_size('ratings'::regclass) AS size
),
index_sizes AS (
    SELECT
        SUM(pg_relation_size(indexname::regclass)) AS total_index_size
    FROM pg_indexes
    WHERE tablename = 'ratings'
)
SELECT
    pg_size_pretty(t.size) AS table_size,
    pg_size_pretty(i.total_index_size) AS total_index_size,
    ROUND(i.total_index_size::numeric / t.size::numeric * 100, 2) || '%' AS index_ratio
FROM table_size t, index_sizes i;

-- ============================================
-- 5. 인덱스 중복 및 사용되지 않는 인덱스 검출
-- ============================================

-- 사용되지 않는 인덱스 찾기
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
    'Consider removing' AS recommendation
FROM pg_stat_user_indexes
WHERE tablename = 'ratings'
    AND idx_scan = 0
    AND indexname NOT LIKE '%pkey'
    AND indexname NOT LIKE '%unique';

-- 중복 가능성이 있는 인덱스 찾기
WITH index_columns AS (
    SELECT
        i.indexname,
        array_agg(a.attname ORDER BY a.attnum) AS columns
    FROM pg_indexes pi
    JOIN pg_class c ON c.relname = pi.indexname
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE pi.tablename = 'ratings'
    GROUP BY i.indexname
)
SELECT
    ic1.indexname AS index1,
    ic2.indexname AS index2,
    ic1.columns AS columns1,
    ic2.columns AS columns2,
    CASE
        WHEN ic1.columns @> ic2.columns THEN 'index1 covers index2'
        WHEN ic2.columns @> ic1.columns THEN 'index2 covers index1'
        ELSE 'partial overlap'
    END AS relationship
FROM index_columns ic1
JOIN index_columns ic2 ON ic1.indexname < ic2.indexname
WHERE ic1.columns && ic2.columns;

-- ============================================
-- 6. 쿼리 플래너 통계
-- ============================================

-- 캐시 히트율 확인
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read) + 0.00001) AS cache_hit_ratio
FROM pg_statio_user_tables
WHERE tablename = 'ratings';

-- 인덱스별 캐시 히트율
SELECT
    indexrelname,
    idx_blks_read,
    idx_blks_hit,
    ROUND(idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read + 0.00001) * 100, 2) AS cache_hit_ratio
FROM pg_statio_user_indexes
WHERE tablename = 'ratings'
ORDER BY idx_blks_hit + idx_blks_read DESC;

-- ============================================
-- 7. 테스트 결과 요약
-- ============================================

DO $$
DECLARE
    total_indexes INT;
    unused_indexes INT;
    total_size BIGINT;
BEGIN
    -- 전체 인덱스 개수
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes
    WHERE tablename = 'ratings';

    -- 사용되지 않는 인덱스 개수
    SELECT COUNT(*) INTO unused_indexes
    FROM pg_stat_user_indexes
    WHERE tablename = 'ratings'
        AND idx_scan = 0
        AND indexname NOT LIKE '%pkey';

    -- 전체 인덱스 크기
    SELECT COALESCE(SUM(pg_relation_size(indexname::regclass)), 0) INTO total_size
    FROM pg_indexes
    WHERE tablename = 'ratings';

    RAISE NOTICE '===== P2D3 성능 테스트 결과 요약 =====';
    RAISE NOTICE 'Total indexes: %', total_indexes;
    RAISE NOTICE 'Unused indexes: %', unused_indexes;
    RAISE NOTICE 'Total index size: %', pg_size_pretty(total_size);
    RAISE NOTICE 'Test completed at: %', NOW();
    RAISE NOTICE '=====================================';
END $$;