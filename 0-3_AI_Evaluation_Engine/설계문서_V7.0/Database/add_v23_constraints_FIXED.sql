-- ============================================================================
-- V23.0 DB 제약 조건 추가 (수정 버전)
-- collected_data 테이블 제약 강화
-- ============================================================================
--
-- 문제: 기존 데이터에 item_num > 60인 행이 있어서 제약 조건 추가 실패
-- 해결: 먼저 데이터 정리 후 제약 조건 추가
--
-- ============================================================================


-- ============================================================================
-- STEP 1: 현재 상태 확인
-- ============================================================================

-- 1-1. 범위 벗어난 데이터 개수 확인
SELECT
  '범위 벗어난 데이터 확인' AS step,
  COUNT(*) as invalid_count,
  MIN(item_num) as min_item_num,
  MAX(item_num) as max_item_num
FROM collected_data
WHERE item_num < 1 OR item_num > 60 OR item_num IS NULL;


-- 1-2. 정치인-카테고리별 개수 확인
SELECT
  politician_id,
  category_name,
  COUNT(*) as total_count,
  MIN(item_num) as min_num,
  MAX(item_num) as max_num
FROM collected_data
GROUP BY politician_id, category_name
HAVING MAX(item_num) > 60 OR MIN(item_num) < 1 OR COUNT(*) > 60
ORDER BY politician_id, category_name;


-- ============================================================================
-- STEP 2: 데이터 정리 (선택 A 또는 B)
-- ============================================================================

-- 선택 A: 60 초과 데이터 삭제 (권장)
-- V23.0 정책: 카테고리당 최대 60개
DELETE FROM collected_data
WHERE item_num > 60 OR item_num < 1 OR item_num IS NULL;

-- 실행 후 확인
SELECT '✅ Step 2A: 범위 벗어난 데이터 삭제 완료' AS status;


/*
-- 선택 B: item_num 재할당 (데이터 유지하려면)
-- 정치인-카테고리별 item_num을 1부터 재할당 (최대 60개만)
WITH ranked AS (
  SELECT
    collected_data_id,
    politician_id,
    category_name,
    ROW_NUMBER() OVER (
      PARTITION BY politician_id, category_name
      ORDER BY collected_data_id
    ) as new_item_num
  FROM collected_data
)
UPDATE collected_data cd
SET item_num = r.new_item_num
FROM ranked r
WHERE cd.collected_data_id = r.collected_data_id
  AND r.new_item_num <= 60;

-- 60개 초과분은 삭제
DELETE FROM collected_data
WHERE collected_data_id IN (
  SELECT collected_data_id
  FROM (
    SELECT
      collected_data_id,
      ROW_NUMBER() OVER (
        PARTITION BY politician_id, category_name
        ORDER BY collected_data_id
      ) as rn
    FROM collected_data
  ) sub
  WHERE rn > 60
);

SELECT '✅ Step 2B: item_num 재할당 완료' AS status;
*/


-- ============================================================================
-- STEP 3: 제약 조건 추가
-- ============================================================================

-- 3-1. item_num 범위 제약 (1~60)
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS check_item_num_range;

ALTER TABLE collected_data
ADD CONSTRAINT check_item_num_range
CHECK (item_num >= 1 AND item_num <= 60);

COMMENT ON CONSTRAINT check_item_num_range ON collected_data IS 'item_num은 1~60 범위만 허용 (목표 50개, 최대 60개)';

SELECT '✅ Step 3-1: item_num 범위 제약 추가 완료' AS status;


-- 3-2. UNIQUE 제약: 중복 방지
-- 같은 정치인, 같은 카테고리, 같은 item_num 중복 불가
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS unique_politician_category_item;

ALTER TABLE collected_data
ADD CONSTRAINT unique_politician_category_item
UNIQUE (politician_id, category_name, item_num);

COMMENT ON CONSTRAINT unique_politician_category_item ON collected_data IS '정치인-카테고리-항목번호 조합 중복 방지';

SELECT '✅ Step 3-2: UNIQUE 제약 추가 완료' AS status;


-- 3-3. source_type NOT NULL 제약
-- V23.0: source_type은 필수 (OFFICIAL 또는 PUBLIC)
ALTER TABLE collected_data
ALTER COLUMN source_type SET NOT NULL;

COMMENT ON COLUMN collected_data.source_type IS 'V23.0: 출처 유형 (OFFICIAL 50% + PUBLIC 50%), 필수값';

SELECT '✅ Step 3-3: source_type NOT NULL 제약 추가 완료' AS status;


-- 3-4. rating 범위 업데이트 (V23.0: -8~+8)
-- 기존 제약 제거 후 재생성
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS collected_data_rating_check;

ALTER TABLE collected_data
ADD CONSTRAINT collected_data_rating_check
CHECK (rating IN (-8, -6, -4, -2, 2, 4, 6, 8));

COMMENT ON COLUMN collected_data.rating IS 'V23.0: 8단계 알파벳 등급 (A=8, B=6, C=4, D=2, -D=-2, -C=-4, -B=-6, -A=-8)';

SELECT '✅ Step 3-4: rating 범위 제약 추가 완료' AS status;


-- ============================================================================
-- STEP 4: View 생성
-- ============================================================================

-- 4-1. 정치인별 카테고리별 개수 확인
CREATE OR REPLACE VIEW v_collection_status AS
SELECT
  politician_id,
  category_name,
  COUNT(*) as total_count,
  SUM(CASE WHEN source_type = 'OFFICIAL' THEN 1 ELSE 0 END) as official_count,
  SUM(CASE WHEN source_type = 'PUBLIC' THEN 1 ELSE 0 END) as public_count,
  SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END) as positive_count,
  SUM(CASE WHEN rating < 0 THEN 1 ELSE 0 END) as negative_count,
  ROUND(AVG(rating)::numeric, 2) as avg_rating
FROM collected_data
GROUP BY politician_id, category_name
ORDER BY politician_id, category_name;

COMMENT ON VIEW v_collection_status IS 'V23.0: 카테고리별 수집 현황 (목표: 50개, OFFICIAL 50%, PUBLIC 50%)';

SELECT '✅ Step 4-1: v_collection_status View 생성 완료' AS status;


-- 4-2. 정치인별 전체 현황
CREATE OR REPLACE VIEW v_politician_collection_summary AS
SELECT
  politician_id,
  COUNT(*) as total_items,
  COUNT(DISTINCT category_name) as categories_collected,
  SUM(CASE WHEN source_type = 'OFFICIAL' THEN 1 ELSE 0 END) as official_total,
  SUM(CASE WHEN source_type = 'PUBLIC' THEN 1 ELSE 0 END) as public_total,
  ROUND(AVG(rating)::numeric, 2) as overall_avg_rating
FROM collected_data
GROUP BY politician_id
ORDER BY politician_id;

COMMENT ON VIEW v_politician_collection_summary IS 'V23.0: 정치인별 전체 수집 현황 (목표: 500개 = 50개 × 10 카테고리)';

SELECT '✅ Step 4-2: v_politician_collection_summary View 생성 완료' AS status;


-- ============================================================================
-- STEP 5: 최종 검증
-- ============================================================================

-- 5-1. 제약 조건 목록 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'collected_data'::regclass
ORDER BY conname;


-- 5-2. 데이터 범위 확인
SELECT
  '최종 검증' AS step,
  COUNT(*) as total_rows,
  COUNT(DISTINCT politician_id) as politicians,
  COUNT(DISTINCT category_name) as categories,
  MIN(item_num) as min_item_num,
  MAX(item_num) as max_item_num,
  COUNT(CASE WHEN source_type IS NULL THEN 1 END) as null_source_type,
  COUNT(CASE WHEN rating NOT IN (-8,-6,-4,-2,2,4,6,8) THEN 1 END) as invalid_rating
FROM collected_data;


-- ============================================================================
-- 완료
-- ============================================================================

COMMENT ON TABLE collected_data IS 'V23.0: AI 수집 데이터 (목표 50개, 허용 45~60개, OFFICIAL 50% + PUBLIC 50%)';

SELECT '
================================================================================
✅ V23.0 제약 조건 추가 완료!
================================================================================

적용된 제약 조건:
1. item_num 범위: 1~60
2. UNIQUE: (politician_id, category_name, item_num)
3. source_type: NOT NULL
4. rating: -8, -6, -4, -2, 2, 4, 6, 8만 허용

생성된 View:
1. v_collection_status - 카테고리별 수집 현황
2. v_politician_collection_summary - 정치인별 전체 현황

다음 단계:
python collect_v23_final.py --politician_id=1 --politician_name="오세훈" --category=1

================================================================================
' AS status;
