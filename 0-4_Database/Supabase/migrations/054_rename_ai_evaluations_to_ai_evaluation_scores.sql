-- Migration 054: Rename ai_evaluations to ai_evaluation_scores
-- Purpose: 테이블 명칭 일관성 확보 (모든 점수 테이블에 'scores' 포함)
-- Date: 2025-12-02

-- 1. 테이블 이름 변경
ALTER TABLE IF EXISTS ai_evaluations
RENAME TO ai_evaluation_scores;

-- 2. 인덱스 이름 변경 (존재하는 경우)
ALTER INDEX IF EXISTS idx_ai_evaluations_politician
RENAME TO idx_ai_evaluation_scores_politician;

ALTER INDEX IF EXISTS idx_ai_evaluations_category
RENAME TO idx_ai_evaluation_scores_category;

-- 3. 제약조건 이름 변경 (필요시)
-- Foreign key 제약조건은 자동으로 따라옴

-- 4. 확인
COMMENT ON TABLE ai_evaluation_scores IS
'V24 기본 방식: 각 AI가 자기가 수집한 뉴스만 평가한 결과';
