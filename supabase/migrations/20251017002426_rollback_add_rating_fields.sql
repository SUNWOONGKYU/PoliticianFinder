-- ============================================
-- P2D1 롤백: 정치인 테이블 평가 통계 필드 제거
-- ============================================
-- Phase: Phase 2 - 정치인 목록/상세 (롤백)
-- 작성일: 2025-01-17
-- 작성자: fullstack-developer AI
-- 설명: 20251017002426_add_rating_fields_to_politicians.sql 마이그레이션을 롤백합니다.
--       순서가 중요합니다 - 의존성이 있는 객체부터 제거합니다.
-- ============================================

-- 롤백 시작 로그
DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of migration P2D1...';
    RAISE NOTICE 'This will remove rating fields from politicians table';
END $$;

-- 1. 인덱스 제거 (컬럼 제거 전에 수행)
DROP INDEX IF EXISTS idx_politicians_region_rating;
DROP INDEX IF EXISTS idx_politicians_party_rating;
DROP INDEX IF EXISTS idx_politicians_avg_rating;

-- 인덱스 제거 확인 로그
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'politicians'
        AND indexname LIKE '%rating%';

    IF index_count = 0 THEN
        RAISE NOTICE 'All rating-related indexes removed successfully';
    ELSE
        RAISE WARNING 'Some rating indexes may still exist: %', index_count;
    END IF;
END $$;

-- 2. 제약조건 제거
ALTER TABLE politicians
DROP CONSTRAINT IF EXISTS check_total_ratings_positive;

ALTER TABLE politicians
DROP CONSTRAINT IF EXISTS check_avg_rating_range;

-- 제약조건 제거 확인 로그
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO constraint_count
    FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'politicians'
        AND con.conname LIKE '%rating%';

    IF constraint_count = 0 THEN
        RAISE NOTICE 'All rating-related constraints removed successfully';
    ELSE
        RAISE WARNING 'Some rating constraints may still exist: %', constraint_count;
    END IF;
END $$;

-- 3. 컬럼 제거 (데이터 백업 옵션 포함)
-- 주의: 실제 운영 환경에서는 데이터 백업을 먼저 수행하는 것을 권장합니다.

-- 옵션: 롤백 전 데이터 백업 (필요 시 주석 해제)
/*
CREATE TABLE IF NOT EXISTS politicians_rating_backup AS
SELECT
    id,
    avg_rating,
    total_ratings,
    NOW() AS backup_timestamp
FROM politicians
WHERE avg_rating > 0 OR total_ratings > 0;

DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO backup_count
    FROM politicians_rating_backup;

    RAISE NOTICE 'Backed up % records with rating data', backup_count;
END $$;
*/

-- 컬럼 제거
ALTER TABLE politicians
DROP COLUMN IF EXISTS total_ratings;

ALTER TABLE politicians
DROP COLUMN IF EXISTS avg_rating;

-- 컬럼 제거 확인 로그
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'politicians'
        AND column_name IN ('avg_rating', 'total_ratings');

    IF column_count = 0 THEN
        RAISE NOTICE 'Rating columns removed successfully';
    ELSE
        RAISE WARNING 'Some rating columns may still exist: %', column_count;
    END IF;
END $$;

-- 4. 통계 정보 업데이트
ANALYZE politicians;

-- 5. 롤백 완료 로그
DO $$
BEGIN
    RAISE NOTICE 'Rollback of migration P2D1 completed successfully';
    RAISE NOTICE '- Removed 3 rating-related indexes';
    RAISE NOTICE '- Removed 2 check constraints';
    RAISE NOTICE '- Removed avg_rating column';
    RAISE NOTICE '- Removed total_ratings column';
    RAISE NOTICE '- Table statistics updated';
    RAISE NOTICE '';
    RAISE NOTICE 'To re-apply the migration, run:';
    RAISE NOTICE '  20251017002426_add_rating_fields_to_politicians.sql';
END $$;

-- ============================================
-- 롤백 검증 쿼리
-- ============================================
/*
-- 컬럼이 제거되었는지 확인
SELECT
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'politicians'
    AND column_name IN ('avg_rating', 'total_ratings');
-- 결과가 0개여야 함

-- 제약조건이 제거되었는지 확인
SELECT
    con.conname
FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'politicians'
    AND con.conname LIKE '%rating%';
-- 결과가 0개여야 함

-- 인덱스가 제거되었는지 확인
SELECT
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'politicians'
    AND indexname LIKE '%rating%';
-- 결과가 0개여야 함

-- 백업 테이블 확인 (백업을 수행한 경우)
-- SELECT * FROM politicians_rating_backup LIMIT 10;
*/