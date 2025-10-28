-- P2D3: 평가 인덱스 추가
-- ratings 테이블의 쿼리 성능 최적화를 위한 추가 인덱스 생성
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 1. 복합 인덱스 (Composite Indexes)
-- ============================================

-- 카테고리별 평가 조회 최적화
-- 특정 정치인의 카테고리별 최신 평가를 빠르게 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_politician_category
ON ratings(politician_id, category, created_at DESC);

-- 사용자 + 카테고리 복합 인덱스
-- 특정 사용자의 카테고리별 평가 이력 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_user_category
ON ratings(user_id, category);

-- 평점 범위 필터링 최적화 (4점 이상 평가 등)
-- 정치인별 고평점 평가를 시간순으로 빠르게 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_politician_score_desc
ON ratings(politician_id, score DESC, created_at DESC);

-- ============================================
-- 2. 부분 인덱스 (Partial Indexes)
-- ============================================

-- 최근 1년 평가만 인덱싱 (최신 데이터 접근 최적화)
-- 대부분의 쿼리가 최근 데이터를 조회하는 경우 효과적
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_recent
ON ratings(politician_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '1 year';

-- 고평점 평가만 인덱싱 (4점 이상)
-- 긍정적 평가를 빠르게 조회할 때 유용
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_high_scores
ON ratings(politician_id, created_at DESC)
WHERE score >= 4;

-- 코멘트가 있는 평가만 인덱싱
-- 상세 리뷰가 있는 평가를 빠르게 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_with_comment
ON ratings(politician_id, created_at DESC)
WHERE comment IS NOT NULL AND LENGTH(comment) > 0;

-- ============================================
-- 3. 표현식 인덱스 (Expression Indexes)
-- ============================================

-- pg_trgm 확장 설치 (전문 검색 기능)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 코멘트 전문 검색 최적화 (GIN 인덱스)
-- LIKE, ILIKE 검색 성능 대폭 개선
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_comment_trgm
ON ratings USING GIN (comment gin_trgm_ops)
WHERE comment IS NOT NULL;

-- 월별 집계 최적화
-- 월별 평균 평점, 평가 개수 등 집계 쿼리 성능 개선
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_month
ON ratings(politician_id, DATE_TRUNC('month', created_at));

-- 연도별 집계 최적화
-- 연도별 통계 분석 쿼리 성능 개선
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_year
ON ratings(politician_id, EXTRACT(YEAR FROM created_at));

-- ============================================
-- 4. 통계 정보 업데이트
-- ============================================

-- 테이블 통계 정보 수집 (쿼리 플래너 최적화)
ANALYZE ratings;

-- 인덱스 생성 완료 확인
DO $$
DECLARE
    index_count INT;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'ratings';

    RAISE NOTICE 'Total indexes on ratings table: %', index_count;
    RAISE NOTICE 'Index creation completed successfully';
END $$;

-- ============================================
-- 5. 인덱스 정보 조회
-- ============================================

-- 생성된 인덱스 목록 및 크기 확인
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'ratings'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 인덱스 사용 통계 초기화를 위한 주석
-- 새로 생성된 인덱스의 사용률은 시간이 지나야 확인 가능
-- SELECT pg_stat_reset();  -- 통계 초기화 (주의: 프로덕션에서는 권장하지 않음)