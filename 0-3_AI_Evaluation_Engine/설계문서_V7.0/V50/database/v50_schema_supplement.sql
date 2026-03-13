-- =============================================
-- V50 스키마 보강 (v50_schema.sql에 누락된 부분)
-- 적용 방법: Supabase CLI (supabase db push) — 2026-03-12 적용 완료
-- =============================================

-- 1. ai_category_scores_v50 테이블 생성 (calculate_scores_v50.py에서 사용)
CREATE TABLE IF NOT EXISTS ai_category_scores_v50 (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id   TEXT        NOT NULL,
  politician_name TEXT,
  category        TEXT        NOT NULL,
  score           INTEGER,
  ai_details      JSONB,
  calculated_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_scores_v50_pol_cat
  ON ai_category_scores_v50 (politician_id, category);

-- 2. ai_final_scores_v50 테이블에 누락 컬럼 추가
ALTER TABLE ai_final_scores_v50 ADD COLUMN IF NOT EXISTS politician_name TEXT;
ALTER TABLE ai_final_scores_v50 ADD COLUMN IF NOT EXISTS ai_category_scores JSONB;
ALTER TABLE ai_final_scores_v50 ADD COLUMN IF NOT EXISTS ai_final_scores JSONB;
ALTER TABLE ai_final_scores_v50 ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'V50';
