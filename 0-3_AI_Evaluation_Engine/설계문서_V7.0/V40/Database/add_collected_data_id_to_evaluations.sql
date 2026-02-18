-- V40 evaluations_v40 테이블 개선
-- collected_data_id 필드 추가로 평가-수집 데이터 연결

-- 1. collected_data_id 필드 추가
ALTER TABLE evaluations_v40
ADD COLUMN IF NOT EXISTS collected_data_id UUID;

-- 2. Foreign Key 제약 설정
ALTER TABLE evaluations_v40
DROP CONSTRAINT IF EXISTS fk_evaluations_collected_data;

ALTER TABLE evaluations_v40
ADD CONSTRAINT fk_evaluations_collected_data
FOREIGN KEY (collected_data_id)
REFERENCES collected_data_v40(id)
ON DELETE SET NULL;

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_evaluations_collected_data_id
ON evaluations_v40(collected_data_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_lookup
ON evaluations_v40(politician_id, category, evaluator_ai);

-- 4. Unique 제약 (중복 평가 방지)
-- 같은 AI가 같은 collected_data를 두 번 평가하는 것을 방지
CREATE UNIQUE INDEX IF NOT EXISTS unique_evaluation_per_data
ON evaluations_v40(politician_id, category, evaluator_ai, collected_data_id)
WHERE collected_data_id IS NOT NULL;

-- 5. 코멘트 추가
COMMENT ON COLUMN evaluations_v40.collected_data_id IS
'collected_data_v40 테이블의 id를 참조. 어떤 수집 데이터를 평가한 것인지 추적.';
