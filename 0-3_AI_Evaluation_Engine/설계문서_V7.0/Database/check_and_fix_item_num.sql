-- ============================================================================
-- 문제 진단 및 해결: item_num 범위 위반 데이터 확인 및 수정
-- ============================================================================

-- Step 1: 범위를 벗어난 데이터 확인
SELECT
  collected_data_id,
  politician_id,
  category_name,
  item_num,
  data_title
FROM collected_data
WHERE item_num < 1 OR item_num > 60 OR item_num IS NULL
ORDER BY politician_id, category_name, item_num;

-- 예상 결과: item_num이 70, 100 등 60 초과하는 데이터가 있을 것


-- ============================================================================
-- Step 2: 해결 방법 선택
-- ============================================================================

-- 방법 A: 범위 벗어난 데이터 삭제 (권장)
-- 60개 초과 데이터는 불필요하므로 삭제
/*
DELETE FROM collected_data
WHERE item_num < 1 OR item_num > 60 OR item_num IS NULL;
*/


-- 방법 B: 60 초과 데이터를 1~60으로 재매핑
-- 정치인-카테고리별로 item_num을 1부터 순차적으로 재할당
/*
WITH ranked AS (
  SELECT
    collected_data_id,
    ROW_NUMBER() OVER (
      PARTITION BY politician_id, category_name
      ORDER BY collected_data_id
    ) as new_item_num
  FROM collected_data
)
UPDATE collected_data cd
SET item_num = r.new_item_num
FROM ranked r
WHERE cd.collected_data_id = r.collected_data_id;
*/


-- ============================================================================
-- Step 3: 수정 후 다시 확인
-- ============================================================================

-- 범위 벗어난 데이터가 없는지 재확인
SELECT
  COUNT(*) as invalid_count,
  MIN(item_num) as min_item_num,
  MAX(item_num) as max_item_num
FROM collected_data
WHERE item_num < 1 OR item_num > 60 OR item_num IS NULL;

-- 예상 결과: invalid_count = 0


-- ============================================================================
-- Step 4: 제약 조건 추가 (수정 후 실행)
-- ============================================================================

-- 기존 제약 조건 삭제 (있으면)
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS check_item_num_range;

-- 새 제약 조건 추가
ALTER TABLE collected_data
ADD CONSTRAINT check_item_num_range
CHECK (item_num >= 1 AND item_num <= 60);

-- 성공 메시지
SELECT '✅ item_num 범위 제약 조건 추가 완료!' AS status;
