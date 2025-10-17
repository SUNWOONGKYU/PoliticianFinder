-- ============================================
-- P2D1: 정치인 테이블에 평가 통계 필드 추가
-- ============================================
-- Phase: Phase 2 - 정치인 목록/상세
-- 작성일: 2025-01-17
-- 작성자: fullstack-developer AI
-- 설명: politicians 테이블에 avg_rating 및 total_ratings 컬럼을 추가하고
--       관련 제약조건 및 성능 최적화 인덱스를 생성합니다.
-- ============================================

-- 1. 평균 평점 컬럼 추가 (1-5 범위, 소수점 1자리)
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(2,1) DEFAULT 0.0;

COMMENT ON COLUMN politicians.avg_rating IS '정치인 평균 평점 (0.0-5.0, 소수점 1자리)';

-- 2. 평가 개수 컬럼 추가
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

COMMENT ON COLUMN politicians.total_ratings IS '총 평가 개수';

-- 3. 평균 평점 제약조건 추가 (0-5 범위)
ALTER TABLE politicians
ADD CONSTRAINT check_avg_rating_range
CHECK (avg_rating >= 0.0 AND avg_rating <= 5.0);

-- 4. 평가 개수 제약조건 추가 (음수 불가)
ALTER TABLE politicians
ADD CONSTRAINT check_total_ratings_positive
CHECK (total_ratings >= 0);

-- 5. 평균 평점 인덱스 추가 (정렬 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_politicians_avg_rating
ON politicians(avg_rating DESC)
WHERE avg_rating > 0; -- 평가가 있는 정치인만 인덱싱

-- 6. 복합 인덱스 추가 (정당 + 평점 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_politicians_party_rating
ON politicians(party, avg_rating DESC)
WHERE avg_rating > 0;

-- 7. 복합 인덱스 추가 (지역 + 평점 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_politicians_region_rating
ON politicians(region, avg_rating DESC)
WHERE avg_rating > 0;

-- 8. 통계 정보 업데이트 (PostgreSQL 최적화)
ANALYZE politicians;

-- 9. 마이그레이션 완료 로그
DO $$
BEGIN
    RAISE NOTICE 'Migration P2D1 completed successfully';
    RAISE NOTICE '- Added avg_rating column (DECIMAL 2,1)';
    RAISE NOTICE '- Added total_ratings column (INTEGER)';
    RAISE NOTICE '- Added check constraints for data validation';
    RAISE NOTICE '- Created 3 indexes for performance optimization';
    RAISE NOTICE '- Table statistics updated';
END $$;

-- ============================================
-- 검증 쿼리 (마이그레이션 후 실행 가능)
-- ============================================
/*
-- 컬럼 추가 확인
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'politicians'
    AND column_name IN ('avg_rating', 'total_ratings')
ORDER BY ordinal_position;

-- 제약조건 확인
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'politicians'
    AND con.conname LIKE '%rating%'
ORDER BY con.conname;

-- 인덱스 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'politicians'
    AND indexname LIKE '%rating%'
ORDER BY indexname;

-- 테이블 구조 전체 확인
\d politicians

-- 샘플 데이터 확인
SELECT
    id,
    name,
    party,
    region,
    avg_rating,
    total_ratings
FROM politicians
LIMIT 10;
*/