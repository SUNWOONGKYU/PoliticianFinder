-- V27.0 테이블 생성 SQL
-- 각자 수집, 각자 평가 방식 (풀링 폐기)
-- 생성일: 2026-01-07

-- 1. collected_data_v27: 수집 데이터 + 평가 결과 통합
CREATE TABLE IF NOT EXISTS collected_data_v27 (
    collected_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name TEXT NOT NULL,  -- 수집 및 평가 주체 (Claude, ChatGPT, Grok, Gemini)
    category_name TEXT NOT NULL,
    item_num INT NOT NULL,
    data_title TEXT,
    data_content TEXT,
    data_source TEXT,
    source_url TEXT,
    source_type TEXT,  -- OFFICIAL / PUBLIC
    data_date TEXT,  -- 데이터 날짜
    collection_date TIMESTAMP DEFAULT NOW(),
    -- 평가 결과 (같은 AI가 평가)
    rating TEXT,  -- A~H
    rating_rationale TEXT,
    evaluation_date TIMESTAMP,
    -- V27 메타데이터
    collection_version TEXT DEFAULT 'V27.0',
    official_date_start TEXT,
    official_date_end TEXT,
    public_date_start TEXT,
    public_date_end TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_collected_data_v27_politician ON collected_data_v27(politician_id);
CREATE INDEX IF NOT EXISTS idx_collected_data_v27_ai ON collected_data_v27(ai_name);
CREATE INDEX IF NOT EXISTS idx_collected_data_v27_category ON collected_data_v27(category_name);
CREATE INDEX IF NOT EXISTS idx_collected_data_v27_rating ON collected_data_v27(rating);

-- 2. ai_category_scores_v27: AI별 카테고리 점수
CREATE TABLE IF NOT EXISTS ai_category_scores_v27 (
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    category_score NUMERIC(5,1),  -- 20.0 ~ 100.0
    rating_count INT DEFAULT 0,
    avg_rating NUMERIC(4,2),  -- 평균 rating 숫자값
    calculation_version TEXT DEFAULT 'V27.0',
    calculation_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (politician_id, ai_name, category_name)
);

-- 3. ai_final_scores_v27: AI별 최종 점수
CREATE TABLE IF NOT EXISTS ai_final_scores_v27 (
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name TEXT NOT NULL,
    total_score INT,  -- 200 ~ 1000
    grade_code TEXT,  -- M, D, E, P, G, S, B, I, Tn, L
    grade_name TEXT,
    category_scores JSONB,  -- 카테고리별 점수 상세
    calculation_version TEXT DEFAULT 'V27.0',
    calculation_date TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (politician_id, ai_name)
);

-- 4. ai_evaluations_v27: 종합 평가 (4개 AI 평균)
CREATE TABLE IF NOT EXISTS ai_evaluations_v27 (
    politician_id TEXT PRIMARY KEY REFERENCES politicians(id) ON DELETE CASCADE,
    ai_count INT NOT NULL,  -- 참여 AI 개수
    avg_score INT NOT NULL,  -- 평균 점수
    grade_code TEXT NOT NULL,
    grade_name TEXT NOT NULL,
    ai_scores JSONB,  -- AI별 점수 상세
    calculation_version TEXT DEFAULT 'V27.0',
    calculation_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_evaluations_v27_score ON ai_evaluations_v27(avg_score DESC);

-- 완료 메시지
SELECT 'V27.0 테이블 생성 완료' as status;
