-- ============================================================
-- V26.0 풀링 시스템용 점수 저장 테이블 생성
--
-- 용도: 점수 계산 결과 저장
-- 생성일: 2026-01-04
-- ============================================================

-- ============================================================
-- 1. ai_category_scores_v26 - 카테고리별 점수
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_category_scores_v26 (
    -- PK
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,

    -- AI 정보
    ai_name TEXT NOT NULL,  -- Claude, ChatGPT, Grok, Gemini

    -- 카테고리 정보
    category_name TEXT NOT NULL,

    -- 점수
    category_score NUMERIC(5,1) NOT NULL,  -- 20.0 ~ 100.0
    rating_count INTEGER NOT NULL DEFAULT 0,  -- 평가 개수

    -- 메타데이터
    calculation_version TEXT DEFAULT 'V26.0_pool',
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 유니크 제약
    UNIQUE(politician_id, ai_name, category_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_category_scores_v26_politician_id
    ON ai_category_scores_v26(politician_id);

CREATE INDEX IF NOT EXISTS idx_category_scores_v26_ai_name
    ON ai_category_scores_v26(ai_name);

-- 코멘트
COMMENT ON TABLE ai_category_scores_v26 IS 'V26.0 풀링 시스템 - 카테고리별 점수 (AI당 10개 카테고리)';


-- ============================================================
-- 2. ai_final_scores_v26 - AI별 최종 점수
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_final_scores_v26 (
    -- PK
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,

    -- AI 정보
    ai_name TEXT NOT NULL,  -- Claude, ChatGPT, Grok, Gemini

    -- 총점
    total_score INTEGER NOT NULL,  -- 200 ~ 1000

    -- 등급
    grade_code TEXT NOT NULL,  -- D, E, P, G, S, B, I, L, M
    grade_name TEXT NOT NULL,  -- Diamond, Emerald, Pearl, ...

    -- 카테고리별 상세 (JSON)
    category_scores JSONB,

    -- 메타데이터
    calculation_version TEXT DEFAULT 'V26.0_pool',
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 유니크 제약
    UNIQUE(politician_id, ai_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_final_scores_v26_politician_id
    ON ai_final_scores_v26(politician_id);

CREATE INDEX IF NOT EXISTS idx_final_scores_v26_ai_name
    ON ai_final_scores_v26(ai_name);

CREATE INDEX IF NOT EXISTS idx_final_scores_v26_grade_code
    ON ai_final_scores_v26(grade_code);

-- 코멘트
COMMENT ON TABLE ai_final_scores_v26 IS 'V26.0 풀링 시스템 - AI별 최종 점수 (총점 + 등급)';


-- ============================================================
-- 3. ai_evaluations_v26 - 4개 AI 종합 평가
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_evaluations_v26 (
    -- PK
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL UNIQUE,

    -- 종합 점수
    ai_count INTEGER NOT NULL DEFAULT 4,  -- 평가한 AI 개수
    avg_score INTEGER NOT NULL,  -- 평균 점수 (200 ~ 1000)

    -- 등급
    grade_code TEXT NOT NULL,  -- D, E, P, G, S, B, I, L, M
    grade_name TEXT NOT NULL,  -- Diamond, Emerald, Pearl, ...

    -- AI별 상세 (JSON)
    ai_scores JSONB,  -- {"Claude": {"score": 780, "grade": "E"}, ...}

    -- 메타데이터
    calculation_version TEXT DEFAULT 'V26.0_pool',
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_evaluations_v26_politician_id
    ON ai_evaluations_v26(politician_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_v26_grade_code
    ON ai_evaluations_v26(grade_code);

CREATE INDEX IF NOT EXISTS idx_evaluations_v26_avg_score
    ON ai_evaluations_v26(avg_score);

-- 코멘트
COMMENT ON TABLE ai_evaluations_v26 IS 'V26.0 풀링 시스템 - 4개 AI 종합 평가 (평균 점수 + 등급)';


-- ============================================================
-- 확인 쿼리
-- ============================================================

-- 테이블 생성 확인
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE '%_v26';

-- 테이블 구조 확인
-- \d ai_category_scores_v26;
-- \d ai_final_scores_v26;
-- \d ai_evaluations_v26;
