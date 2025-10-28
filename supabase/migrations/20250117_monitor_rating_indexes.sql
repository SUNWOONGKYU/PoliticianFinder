-- P2D3: 평가 인덱스 모니터링
-- ratings 테이블의 인덱스 사용률 및 성능 모니터링
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 1. 인덱스 기본 정보
-- ============================================

-- 모든 인덱스 목록 및 정의 확인
SELECT
    schemaname AS schema_name,
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE tablename = 'ratings'
ORDER BY indexname;

-- ============================================
-- 2. 인덱스 사용률 분석
-- ============================================

-- 인덱스별 사용 통계
SELECT
    indexrelname AS index_name,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE
        WHEN idx_scan = 0 THEN '❌ NEVER USED'
        WHEN idx_scan < 10 THEN '⚠️ RARELY USED'
        WHEN idx_scan < 100 THEN '🔶 OCCASIONALLY USED'
        WHEN idx_scan < 1000 THEN '✅ REGULARLY USED'
        ELSE '🚀 HEAVILY USED'
    END AS usage_status,
    ROUND(
        CASE
            WHEN idx_scan > 0 THEN idx_tup_fetch::numeric / idx_scan
            ELSE 0
        END, 2
    ) AS avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE tablename = 'ratings'
ORDER BY idx_scan DESC;

-- ============================================
-- 3. 인덱스 효율성 분석
-- ============================================

-- 인덱스 I/O 효율성
SELECT
    indexrelname AS index_name,
    idx_blks_read AS blocks_read_from_disk,
    idx_blks_hit AS blocks_hit_in_cache,
    ROUND(
        idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0) * 100, 2
    ) AS cache_hit_ratio,
    CASE
        WHEN idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0) >= 0.99 THEN '🎯 Excellent'
        WHEN idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0) >= 0.95 THEN '✅ Good'
        WHEN idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0) >= 0.90 THEN '🔶 Fair'
        ELSE '⚠️ Poor'
    END AS cache_performance
FROM pg_statio_user_indexes
WHERE tablename = 'ratings'
    AND idx_blks_hit + idx_blks_read > 0
ORDER BY cache_hit_ratio DESC;

-- ============================================
-- 4. 인덱스 크기 분석
-- ============================================

-- 인덱스 크기 및 팽창도 (bloat) 추정
WITH index_bloat AS (
    SELECT
        schemaname,
        tablename,
        indexname,
        pg_relation_size(indexname::regclass) AS index_bytes,
        CASE WHEN pg_relation_size(indexname::regclass) = 0 THEN 0
             ELSE ROUND(100.0 * pg_relation_size(indexname::regclass) /
                        pg_relation_size(tablename::regclass), 2)
        END AS index_ratio
    FROM pg_indexes
    WHERE tablename = 'ratings'
)
SELECT
    indexname AS index_name,
    pg_size_pretty(index_bytes) AS index_size,
    index_ratio || '%' AS size_vs_table,
    CASE
        WHEN index_ratio > 50 THEN '⚠️ Very Large'
        WHEN index_ratio > 30 THEN '🔶 Large'
        WHEN index_ratio > 10 THEN '✅ Normal'
        ELSE '🎯 Optimal'
    END AS size_assessment
FROM index_bloat
ORDER BY index_bytes DESC;

-- ============================================
-- 5. 인덱스 유지보수 상태
-- ============================================

-- 마지막 VACUUM 및 ANALYZE 정보
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
    autoanalyze_count,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) AS dead_tuple_ratio
FROM pg_stat_user_tables
WHERE tablename = 'ratings';

-- ============================================
-- 6. 인덱스 추천 분석
-- ============================================

-- 사용되지 않는 인덱스 (제거 후보)
WITH unused_indexes AS (
    SELECT
        indexrelname AS index_name,
        idx_scan AS scan_count,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        pg_relation_size(indexrelid) AS size_bytes
    FROM pg_stat_user_indexes
    WHERE tablename = 'ratings'
        AND idx_scan < 10
        AND indexrelname NOT LIKE '%pkey'
        AND indexrelname NOT LIKE '%unique'
)
SELECT
    index_name,
    scan_count,
    index_size,
    '🗑️ Consider removing - low usage' AS recommendation
FROM unused_indexes
ORDER BY size_bytes DESC;

-- 중복 가능성이 있는 인덱스
WITH index_cols AS (
    SELECT
        indexname,
        indexdef,
        regexp_replace(indexdef, '.*\((.*)\)', '\1') AS columns
    FROM pg_indexes
    WHERE tablename = 'ratings'
)
SELECT
    a.indexname AS index1,
    b.indexname AS index2,
    a.columns AS columns1,
    b.columns AS columns2,
    '🔄 Potential duplicate - review needed' AS recommendation
FROM index_cols a
JOIN index_cols b ON a.indexname < b.indexname
WHERE a.columns LIKE b.columns || '%'
   OR b.columns LIKE a.columns || '%';

-- ============================================
-- 7. 쿼리 패턴 분석 (느린 쿼리 찾기)
-- ============================================

-- pg_stat_statements가 활성화된 경우 사용
-- 느린 쿼리 TOP 10 (ratings 테이블 관련)
/*
SELECT
    substring(query, 1, 100) AS query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_time_ms,
    rows,
    ROUND(rows::numeric / NULLIF(calls, 0), 2) AS avg_rows
FROM pg_stat_statements
WHERE query ILIKE '%ratings%'
    AND query NOT ILIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 10;
*/

-- ============================================
-- 8. 실시간 모니터링 대시보드 데이터
-- ============================================

-- 종합 인덱스 상태 리포트
WITH index_stats AS (
    SELECT
        COUNT(*) AS total_indexes,
        COUNT(*) FILTER (WHERE idx_scan = 0) AS unused_indexes,
        COUNT(*) FILTER (WHERE idx_scan > 0 AND idx_scan < 100) AS low_use_indexes,
        COUNT(*) FILTER (WHERE idx_scan >= 100) AS active_indexes
    FROM pg_stat_user_indexes
    WHERE tablename = 'ratings'
),
size_stats AS (
    SELECT
        SUM(pg_relation_size(indexname::regclass)) AS total_index_size,
        pg_relation_size('ratings'::regclass) AS table_size
    FROM pg_indexes
    WHERE tablename = 'ratings'
),
cache_stats AS (
    SELECT
        AVG(idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0)) * 100 AS avg_cache_hit_ratio
    FROM pg_statio_user_indexes
    WHERE tablename = 'ratings'
        AND idx_blks_hit + idx_blks_read > 0
)
SELECT
    '📊 INDEX HEALTH REPORT FOR ratings TABLE' AS report_title,
    '========================================' AS separator,
    'Total Indexes: ' || i.total_indexes AS total,
    'Active Indexes: ' || i.active_indexes || ' (' ||
        ROUND(i.active_indexes::numeric / i.total_indexes * 100, 1) || '%)' AS active,
    'Low Use Indexes: ' || i.low_use_indexes AS low_use,
    'Unused Indexes: ' || i.unused_indexes AS unused,
    'Total Index Size: ' || pg_size_pretty(s.total_index_size) AS index_size,
    'Table Size: ' || pg_size_pretty(s.table_size) AS table_size,
    'Index/Table Ratio: ' || ROUND(s.total_index_size::numeric / s.table_size * 100, 1) || '%' AS ratio,
    'Avg Cache Hit Ratio: ' || ROUND(c.avg_cache_hit_ratio, 1) || '%' AS cache_hit,
    'Report Generated: ' || NOW()::timestamp(0) AS generated_at
FROM index_stats i, size_stats s, cache_stats c;

-- ============================================
-- 9. 성능 개선 제안
-- ============================================

DO $$
DECLARE
    unused_count INT;
    large_count INT;
    low_cache_count INT;
BEGIN
    -- 사용되지 않는 인덱스 수
    SELECT COUNT(*) INTO unused_count
    FROM pg_stat_user_indexes
    WHERE tablename = 'ratings'
        AND idx_scan = 0
        AND indexrelname NOT LIKE '%pkey';

    -- 큰 인덱스 수 (테이블 크기의 30% 이상)
    SELECT COUNT(*) INTO large_count
    FROM pg_indexes i
    WHERE tablename = 'ratings'
        AND pg_relation_size(indexname::regclass) >
            pg_relation_size('ratings'::regclass) * 0.3;

    -- 캐시 히트율이 낮은 인덱스 수
    SELECT COUNT(*) INTO low_cache_count
    FROM pg_statio_user_indexes
    WHERE tablename = 'ratings'
        AND idx_blks_hit + idx_blks_read > 100
        AND idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read) < 0.9;

    RAISE NOTICE '';
    RAISE NOTICE '🔍 PERFORMANCE RECOMMENDATIONS';
    RAISE NOTICE '================================';

    IF unused_count > 0 THEN
        RAISE NOTICE '⚠️ Found % unused indexes - consider removing them', unused_count;
    END IF;

    IF large_count > 0 THEN
        RAISE NOTICE '⚠️ Found % large indexes (>30%% of table) - review necessity', large_count;
    END IF;

    IF low_cache_count > 0 THEN
        RAISE NOTICE '⚠️ Found % indexes with poor cache hit ratio - increase shared_buffers', low_cache_count;
    END IF;

    IF unused_count = 0 AND large_count = 0 AND low_cache_count = 0 THEN
        RAISE NOTICE '✅ All indexes are performing well!';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Next Actions:';
    RAISE NOTICE '1. Run VACUUM ANALYZE ratings; regularly';
    RAISE NOTICE '2. Monitor slow queries with pg_stat_statements';
    RAISE NOTICE '3. Review and remove unused indexes quarterly';
    RAISE NOTICE '4. Consider partitioning if table grows > 10GB';
END $$;