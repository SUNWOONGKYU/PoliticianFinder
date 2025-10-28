-- P2D3: 평가 인덱스 롤백
-- ratings 테이블의 추가 인덱스 제거
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 인덱스 제거 전 사용률 확인
-- ============================================

-- 제거하려는 인덱스의 사용 통계 백업
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'ratings'
    AND indexname IN (
        'idx_ratings_year',
        'idx_ratings_month',
        'idx_ratings_comment_trgm',
        'idx_ratings_with_comment',
        'idx_ratings_high_scores',
        'idx_ratings_recent',
        'idx_ratings_politician_score_desc',
        'idx_ratings_user_category',
        'idx_ratings_politician_category'
    )
ORDER BY idx_scan DESC;

-- ============================================
-- 1. 표현식 인덱스 제거
-- ============================================

DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_year;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_month;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_comment_trgm;

-- ============================================
-- 2. 부분 인덱스 제거
-- ============================================

DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_with_comment;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_high_scores;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_recent;

-- ============================================
-- 3. 복합 인덱스 제거
-- ============================================

DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_politician_score_desc;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_user_category;
DROP INDEX CONCURRENTLY IF EXISTS idx_ratings_politician_category;

-- ============================================
-- 4. 확장 제거 (선택적)
-- ============================================

-- 주의: pg_trgm은 다른 테이블에서도 사용 중일 수 있으므로
-- 시스템 전체에서 사용되지 않는 경우에만 제거
-- 확인 쿼리:
SELECT
    n.nspname as schema,
    c.relname as table,
    a.attname as column,
    pg_get_indexdef(i.indexrelid, 0, true) as index_definition
FROM pg_index i
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE pg_get_indexdef(i.indexrelid, 0, true) LIKE '%gin_trgm_ops%';

-- 다른 곳에서 사용되지 않는다면:
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- ============================================
-- 5. 통계 정보 업데이트
-- ============================================

-- 인덱스 제거 후 통계 재수집
ANALYZE ratings;

-- ============================================
-- 6. 롤백 완료 확인
-- ============================================

-- 남은 인덱스 목록 확인
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'ratings'
ORDER BY indexname;

DO $$
DECLARE
    remaining_count INT;
BEGIN
    -- P2D3에서 생성한 인덱스가 남아있는지 확인
    SELECT COUNT(*) INTO remaining_count
    FROM pg_indexes
    WHERE tablename = 'ratings'
        AND indexname IN (
            'idx_ratings_year',
            'idx_ratings_month',
            'idx_ratings_comment_trgm',
            'idx_ratings_with_comment',
            'idx_ratings_high_scores',
            'idx_ratings_recent',
            'idx_ratings_politician_score_desc',
            'idx_ratings_user_category',
            'idx_ratings_politician_category'
        );

    IF remaining_count = 0 THEN
        RAISE NOTICE 'Rollback successful: All P2D3 indexes removed';
    ELSE
        RAISE WARNING 'Rollback incomplete: % indexes still exist', remaining_count;
    END IF;
END $$;