-- ============================================================================
-- PERMANENT FIX: collected_data.politician_id 타입 불일치 해결
-- ============================================================================
-- 문제:
--   - politicians.id: UUID
--   - collected_data.politician_id: INTEGER (← 타입 불일치!)
--
-- 해결:
--   - collected_data.politician_id를 VARCHAR(50)으로 변경
--   - UUID와 INTEGER(문자열) 모두 저장 가능하도록 변경
--
-- 작성일: 2025-11-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: 기존 데이터 백업 (안전장치)
-- ============================================================================
CREATE TABLE IF NOT EXISTS collected_data_backup_20251119 AS
SELECT * FROM collected_data;

SELECT COUNT(*) AS backup_count FROM collected_data_backup_20251119;

-- ============================================================================
-- Step 2: politician_id 컬럼 타입 변경
-- INTEGER → VARCHAR(50)
-- ============================================================================

-- 2-1. 타입 변경
ALTER TABLE collected_data
ALTER COLUMN politician_id TYPE VARCHAR(50);

-- 2-2. NOT NULL 제약 유지
ALTER TABLE collected_data
ALTER COLUMN politician_id SET NOT NULL;

-- ============================================================================
-- Step 3: 인덱스 재생성
-- ============================================================================

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_data_politician;
DROP INDEX IF EXISTS idx_data_politician_ai;
DROP INDEX IF EXISTS idx_collected_data_politician_id;
DROP INDEX IF EXISTS idx_collected_data_politician_ai;

-- 새 인덱스 생성
CREATE INDEX idx_collected_data_politician_id ON collected_data(politician_id);
CREATE INDEX idx_collected_data_politician_ai ON collected_data(politician_id, ai_name);
CREATE INDEX idx_collected_data_category ON collected_data(category_name);
CREATE INDEX idx_collected_data_rating ON collected_data(rating);

-- ============================================================================
-- Step 4: 변경 확인
-- ============================================================================
SELECT
  'collected_data' AS table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'collected_data' AND column_name = 'politician_id';

-- ============================================================================
-- Step 5: 테스트 쿼리 (UUID와 INTEGER 모두 작동 확인)
-- ============================================================================

-- UUID 사용 (정청래, 나경원)
SELECT COUNT(*) AS uuid_count
FROM collected_data
WHERE politician_id IN (
  '8b28331d-3034-436f-8c15-9e60cc533772',
  '88aaecf2-d21e-4f66-84ae-b7db336ae1f6'
);

-- INTEGER(문자열) 사용 (오세훈)
SELECT COUNT(*) AS integer_count
FROM collected_data
WHERE politician_id = '5';

COMMIT;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ collected_data.politician_id 타입 변경 완료!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '변경 내용:';
  RAISE NOTICE '  - 기존: INTEGER';
  RAISE NOTICE '  - 변경: VARCHAR(50)';
  RAISE NOTICE '';
  RAISE NOTICE '이제 다음 두 가지 모두 저장 가능:';
  RAISE NOTICE '  1. UUID: "8b28331d-3034-436f-8c15-9e60cc533772"';
  RAISE NOTICE '  2. INTEGER(문자열): "5", "2", "11"';
  RAISE NOTICE '';
  RAISE NOTICE '백업 테이블: collected_data_backup_20251119';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '  1. collect_v21_final.py 다시 실행';
  RAISE NOTICE '  2. 정청래, 나경원 데이터 수집 재시도';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
