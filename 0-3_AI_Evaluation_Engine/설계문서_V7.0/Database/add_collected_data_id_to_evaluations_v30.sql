-- ============================================================
-- evaluations_v30 테이블에 collected_data_id 컬럼 추가
-- 작성일: 2026-01-19
--
-- 목적: 어떤 수집 데이터를 평가했는지 추적하기 위함
-- 이유: V30 풀링에서 4개 AI가 모든 데이터를 평가해야 하는데,
--       현재는 어떤 데이터를 평가했는지 알 수 없음
-- ============================================================

-- 1. collected_data_id 컬럼 추가
ALTER TABLE evaluations_v30
ADD COLUMN IF NOT EXISTS collected_data_id UUID;

-- 2. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_v30_eval_collected_data
ON evaluations_v30(collected_data_id);

-- 3. Foreign Key 제약조건 추가 (선택사항)
-- 데이터 무결성을 보장하지만, 삽입 순서에 제약 생김
ALTER TABLE evaluations_v30
ADD CONSTRAINT fk_eval_collected_data
FOREIGN KEY (collected_data_id)
REFERENCES collected_data_v30(id)
ON DELETE CASCADE;

-- 4. 유니크 제약 추가 (같은 데이터를 같은 AI가 중복 평가 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_v30_eval_unique
ON evaluations_v30(collected_data_id, evaluator_ai);

-- 5. 코멘트 추가
COMMENT ON COLUMN evaluations_v30.collected_data_id IS '평가한 수집 데이터 ID (collected_data_v30.id 참조)';

-- ============================================================
-- 확인 쿼리
-- ============================================================
-- 테이블 구조 확인
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'evaluations_v30'
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'evaluations_v30'
ORDER BY indexname;
