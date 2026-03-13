-- =============================================
-- V50 Supabase Schema
-- Generated: 2026-03-08
-- Tables: collected_data_v50, evaluations_v50, ai_final_scores_v50
-- Also: ALTER TABLE politicians (V50 pipeline status columns)
-- =============================================

-- -------------------------------------------------
-- 1. collected_data_v50
--    수집 원본 데이터 (Gemini + Naver + Grok-X 3채널)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS collected_data_v50 (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT        NOT NULL,  -- 8자리 hex (예: '17270f25')
  category      TEXT        NOT NULL,  -- expertise / leadership / vision / ...
  title         TEXT,
  content       TEXT,
  source_url    TEXT,
  source_name   TEXT,
  source_type   TEXT        CHECK (source_type IN ('OFFICIAL', 'PUBLIC')),
  published_date DATE,
  sentiment     TEXT        CHECK (sentiment IN ('negative', 'positive', 'free')),
  collector_ai  TEXT,        -- 'Gemini' | 'Naver' | 'GrokX'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collected_v50_pol_cat
  ON collected_data_v50 (politician_id, category);

CREATE INDEX IF NOT EXISTS idx_collected_v50_pol_cat_src
  ON collected_data_v50 (politician_id, category, source_type);


-- -------------------------------------------------
-- 2. evaluations_v50
--    4개 AI 평가 결과 (Claude / Gemini / ChatGPT / Grok)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluations_v50 (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id     TEXT        NOT NULL,  -- 8자리 hex
  category          TEXT        NOT NULL,
  evaluator_ai      TEXT        NOT NULL   CHECK (evaluator_ai IN ('Claude', 'Gemini', 'ChatGPT', 'Grok')),
  collected_data_id UUID,                  -- FK to collected_data_v50.id (nullable)
  rating            TEXT        CHECK (rating IN ('+4','+3','+2','+1','-1','-2','-3','-4','X')),
  reasoning         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evals_v50_pol_cat
  ON evaluations_v50 (politician_id, category);

CREATE INDEX IF NOT EXISTS idx_evals_v50_pol_cat_ai
  ON evaluations_v50 (politician_id, category, evaluator_ai);


-- -------------------------------------------------
-- 3. ai_final_scores_v50
--    정치인별 최종 점수 (200~1000)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_final_scores_v50 (
  politician_id      TEXT        PRIMARY KEY,  -- 8자리 hex
  final_score        INTEGER,                  -- 200~1000
  grade              TEXT,                     -- S/A/B/C/D/F (900/800/700/600/500 기준)
  grade_name         TEXT,
  category_scores    JSONB,                    -- {expertise: 72, leadership: 68, ...}
  total_evaluations  INTEGER,
  give_up_categories JSONB,                    -- 포기된 카테고리 목록
  calculated_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);


-- -------------------------------------------------
-- 4. politicians 테이블 컬럼 추가 (V50 파이프라인 상태 추적)
--    IF NOT EXISTS 사용으로 이미 존재하는 컬럼 무시
-- -------------------------------------------------
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS processing_status TEXT    DEFAULT 'pending';
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS error_detail       TEXT;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS final_score        INTEGER;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS grade              TEXT;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS report_path        TEXT;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS completed_at       TIMESTAMPTZ;
