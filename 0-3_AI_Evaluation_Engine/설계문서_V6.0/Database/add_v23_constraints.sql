-- ============================================================================
-- V23.0 DB 제약 조건 추가
-- collected_data 테이블 제약 강화
-- ============================================================================

-- 1. item_num 범위 제약 (1~60)
-- 목표는 50개지만 재시도로 60개까지 수집 가능
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS check_item_num_range;

ALTER TABLE collected_data
ADD CONSTRAINT check_item_num_range
CHECK (item_num >= 1 AND item_num <= 60);

COMMENT ON CONSTRAINT check_item_num_range ON collected_data IS 'item_num은 1~60 범위만 허용 (목표 50개, 최대 60개)';


-- 2. UNIQUE 제약: 중복 방지
-- 같은 정치인, 같은 카테고리, 같은 item_num 중복 불가
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS unique_politician_category_item;

ALTER TABLE collected_data
ADD CONSTRAINT unique_politician_category_item
UNIQUE (politician_id, category_name, item_num);

COMMENT ON CONSTRAINT unique_politician_category_item ON collected_data IS '정치인-카테고리-항목번호 조합 중복 방지';


-- 3. source_type NOT NULL 제약
-- V23.0: source_type은 필수 (OFFICIAL 또는 PUBLIC)
ALTER TABLE collected_data
ALTER COLUMN source_type SET NOT NULL;

COMMENT ON COLUMN collected_data.source_type IS 'V23.0: 출처 유형 (OFFICIAL 50% + PUBLIC 50%), 필수값';


-- 4. rating 범위 업데이트 (V23.0: -8~+8)
-- 기존 제약 제거 후 재생성
ALTER TABLE collected_data
DROP CONSTRAINT IF EXISTS collected_data_rating_check;

ALTER TABLE collected_data
ADD CONSTRAINT collected_data_rating_check
CHECK (rating IN (-8, -6, -4, -2, 2, 4, 6, 8));

COMMENT ON COLUMN collected_data.rating IS 'V23.0: 8단계 알파벳 등급 (A=8, B=6, C=4, D=2, -D=-2, -C=-4, -B=-6, -A=-8)';


-- ============================================================================
-- 검증 쿼리
-- ============================================================================

-- 1. 정치인별 카테고리별 개수 확인
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


-- 2. 정치인별 전체 현황
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


-- ============================================================================
-- 제약 조건 확인
-- ============================================================================

-- 현재 제약 조건 목록 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'collected_data'::regclass
ORDER BY conname;


-- ============================================================================
-- 테스트 데이터 삽입 (제약 조건 검증)
-- ============================================================================

-- 테스트 1: 정상 데이터 (성공해야 함)
/*
INSERT INTO collected_data (
  politician_id, category_name, item_num, ai_name,
  data_title, data_content, data_source, source_url,
  rating, rating_rationale, source_type
) VALUES (
  999, 'Expertise', 1, 'test-model',
  'Test Title', 'Test Content', 'Test Source', 'http://test.com',
  8, 'Test Rationale', 'OFFICIAL'
);
*/

-- 테스트 2: item_num 범위 초과 (실패해야 함)
/*
INSERT INTO collected_data (
  politician_id, category_name, item_num, ai_name,
  data_title, data_content, data_source, rating, source_type
) VALUES (
  999, 'Expertise', 61, 'test-model',  -- ❌ 60 초과
  'Test', 'Test', 'Test', 8, 'OFFICIAL'
);
-- ERROR: new row for relation "collected_data" violates check constraint "check_item_num_range"
*/

-- 테스트 3: 중복 항목 (실패해야 함)
/*
INSERT INTO collected_data (
  politician_id, category_name, item_num, ai_name,
  data_title, data_content, data_source, rating, source_type
) VALUES (
  999, 'Expertise', 1, 'test-model',  -- ❌ 이미 존재하는 (999, Expertise, 1)
  'Test', 'Test', 'Test', 8, 'OFFICIAL'
);
-- ERROR: duplicate key value violates unique constraint "unique_politician_category_item"
*/

-- 테스트 4: source_type NULL (실패해야 함)
/*
INSERT INTO collected_data (
  politician_id, category_name, item_num, ai_name,
  data_title, data_content, data_source, rating, source_type
) VALUES (
  999, 'Expertise', 2, 'test-model',
  'Test', 'Test', 'Test', 8, NULL  -- ❌ NULL 불가
);
-- ERROR: null value in column "source_type" violates not-null constraint
*/

-- 테스트 5: 잘못된 rating (실패해야 함)
/*
INSERT INTO collected_data (
  politician_id, category_name, item_num, ai_name,
  data_title, data_content, data_source, rating, source_type
) VALUES (
  999, 'Expertise', 3, 'test-model',
  'Test', 'Test', 'Test', 5, 'OFFICIAL'  -- ❌ 5는 유효하지 않은 등급
);
-- ERROR: new row for relation "collected_data" violates check constraint "collected_data_rating_check"
*/


-- ============================================================================
-- 정리: 테스트 데이터 삭제
-- ============================================================================

-- DELETE FROM collected_data WHERE politician_id = 999;


-- ============================================================================
-- 완료
-- ============================================================================

COMMENT ON TABLE collected_data IS 'V23.0: AI 수집 데이터 (목표 50개, 허용 45~60개, OFFICIAL 50% + PUBLIC 50%)';

SELECT 'V23.0 제약 조건 추가 완료!' AS status;
