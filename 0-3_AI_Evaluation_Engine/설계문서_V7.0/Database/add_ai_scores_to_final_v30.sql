-- ============================================================
-- ai_final_scores_v30 테이블에 AI별 점수 컬럼 추가
-- 작성일: 2026-01-19
--
-- 목적: AI별 카테고리 점수 및 최종 점수 저장
-- ============================================================

-- 1. ai_category_scores 컬럼 추가 (AI별 카테고리 점수)
-- 예: {"Claude": {"expertise": 72, "leadership": 73, ...}, "ChatGPT": {...}, ...}
ALTER TABLE ai_final_scores_v30
ADD COLUMN IF NOT EXISTS ai_category_scores JSONB;

-- 2. ai_final_scores 컬럼 추가 (AI별 최종 점수)
-- 예: {"Claude": 696, "ChatGPT": 699, "Gemini": 682, "Grok": 700}
ALTER TABLE ai_final_scores_v30
ADD COLUMN IF NOT EXISTS ai_final_scores JSONB;

-- 코멘트
COMMENT ON COLUMN ai_final_scores_v30.ai_category_scores IS 'AI별 카테고리 점수 (JSONB)';
COMMENT ON COLUMN ai_final_scores_v30.ai_final_scores IS 'AI별 최종 점수 (JSONB)';

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_final_scores_v30'
ORDER BY ordinal_position;
