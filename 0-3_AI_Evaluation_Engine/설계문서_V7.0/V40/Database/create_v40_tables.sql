-- V40 AI Evaluation Engine Tables
-- ===================================
--
-- V40 System:
-- - 2 collection channels: Gemini CLI + Naver API
-- - 4 evaluation AIs: Claude, ChatGPT, Gemini, Grok
-- - 10 categories: expertise, leadership, vision, integrity, ethics,
--                  accountability, transparency, communication, responsiveness, publicinterest
-- - Rating: +4, +3, +2, +1, -1, -2, -3, -4 (8 grades, NO zero). X = 제외(exclusion, not a grade)
-- - Buffer: 20% per category (base 100, max 120). Total base 1,000/politician, max 1,200
-- - Period limits: OFFICIAL 4 years, PUBLIC 2 years
-- - Sentiment types: negative / positive / free (NOT "neutral")

-- ===================================
-- 1. collected_data_v40 (수집 데이터 테이블)
-- ===================================
CREATE TABLE IF NOT EXISTS public.collected_data_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,

    -- 카테고리 (10개 중 하나)
    category TEXT NOT NULL CHECK (
        category IN (
            'expertise', 'leadership', 'vision', 'integrity', 'ethics',
            'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
        )
    ),

    -- 수집 데이터 정보
    published_date DATE,
    title TEXT,
    content TEXT,
    source_url TEXT,
    source_name TEXT,

    -- 수집 메타데이터
    collector_ai TEXT NOT NULL CHECK (collector_ai IN ('Gemini', 'Naver')),
    data_type TEXT NOT NULL CHECK (data_type IN ('official', 'public')),
    sentiment TEXT NOT NULL DEFAULT 'free' CHECK (sentiment IN ('negative', 'positive', 'free')),

    -- 타임스탬프
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 인덱스
    CONSTRAINT collected_data_v40_politician_url_key UNIQUE (politician_id, source_url)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_collected_data_v40_politician_category
    ON public.collected_data_v40(politician_id, category);
CREATE INDEX IF NOT EXISTS idx_collected_data_v40_collector_ai
    ON public.collected_data_v40(collector_ai);
CREATE INDEX IF NOT EXISTS idx_collected_data_v40_data_type
    ON public.collected_data_v40(data_type);
CREATE INDEX IF NOT EXISTS idx_collected_data_v40_published_date
    ON public.collected_data_v40(published_date);
CREATE INDEX IF NOT EXISTS idx_collected_data_v40_collected_at
    ON public.collected_data_v40(collected_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.collected_data_v40 ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자 읽기 가능
CREATE POLICY "collected_data_v40_select_policy" ON public.collected_data_v40
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 쓰기 가능
CREATE POLICY "collected_data_v40_insert_policy" ON public.collected_data_v40
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "collected_data_v40_update_policy" ON public.collected_data_v40
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "collected_data_v40_delete_policy" ON public.collected_data_v40
    FOR DELETE
    USING (auth.role() = 'authenticated');


-- ===================================
-- 2. evaluations_v40 (평가 결과 테이블)
-- ===================================
CREATE TABLE IF NOT EXISTS public.evaluations_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,
    politician_name TEXT,

    -- 카테고리 (10개 중 하나)
    category TEXT NOT NULL CHECK (
        category IN (
            'expertise', 'leadership', 'vision', 'integrity', 'ethics',
            'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
        )
    ),

    -- 평가 AI (4개 중 하나)
    evaluator_ai TEXT NOT NULL CHECK (
        evaluator_ai IN ('Claude', 'ChatGPT', 'Gemini', 'Grok')
    ),

    -- 수집 데이터 연결
    collected_data_id UUID REFERENCES public.collected_data_v40(id) ON DELETE SET NULL,

    -- 평가 결과
    rating TEXT CHECK (
        rating IN ('+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X')
    ),
    reasoning TEXT,  -- 평가 근거 (최대 1000자)

    -- 타임스탬프
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 유니크 제약: 동일 정치인/카테고리/AI/데이터에 대한 중복 평가 방지
    CONSTRAINT evaluations_v40_unique_key
        UNIQUE (politician_id, category, evaluator_ai, collected_data_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evaluations_v40_politician_category
    ON public.evaluations_v40(politician_id, category);
CREATE INDEX IF NOT EXISTS idx_evaluations_v40_evaluator_ai
    ON public.evaluations_v40(evaluator_ai);
CREATE INDEX IF NOT EXISTS idx_evaluations_v40_rating
    ON public.evaluations_v40(rating);
CREATE INDEX IF NOT EXISTS idx_evaluations_v40_evaluated_at
    ON public.evaluations_v40(evaluated_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_v40_collected_data_id
    ON public.evaluations_v40(collected_data_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.evaluations_v40 ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자 읽기 가능
CREATE POLICY "evaluations_v40_select_policy" ON public.evaluations_v40
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 쓰기 가능
CREATE POLICY "evaluations_v40_insert_policy" ON public.evaluations_v40
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "evaluations_v40_update_policy" ON public.evaluations_v40
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "evaluations_v40_delete_policy" ON public.evaluations_v40
    FOR DELETE
    USING (auth.role() = 'authenticated');


-- ===================================
-- 3. scores_v40 (최종 점수 테이블)
-- ===================================
CREATE TABLE IF NOT EXISTS public.scores_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,
    politician_name TEXT,

    -- 카테고리별 점수 (10개, base 100, max 120, 20% buffer)
    expertise_score INTEGER CHECK (expertise_score >= 0 AND expertise_score <= 120),
    leadership_score INTEGER CHECK (leadership_score >= 0 AND leadership_score <= 120),
    vision_score INTEGER CHECK (vision_score >= 0 AND vision_score <= 120),
    integrity_score INTEGER CHECK (integrity_score >= 0 AND integrity_score <= 120),
    ethics_score INTEGER CHECK (ethics_score >= 0 AND ethics_score <= 120),
    accountability_score INTEGER CHECK (accountability_score >= 0 AND accountability_score <= 120),
    transparency_score INTEGER CHECK (transparency_score >= 0 AND transparency_score <= 120),
    communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 120),
    responsiveness_score INTEGER CHECK (responsiveness_score >= 0 AND responsiveness_score <= 120),
    publicinterest_score INTEGER CHECK (publicinterest_score >= 0 AND publicinterest_score <= 120),

    -- 최종 점수 (200-1000 범위, max 1200 with buffer)
    total_score INTEGER CHECK (total_score >= 200 AND total_score <= 1200),

    -- 통계
    total_events_collected INTEGER DEFAULT 0,
    total_evaluations INTEGER DEFAULT 0,

    -- 타임스탬프
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 유니크 제약: 정치인당 하나의 점수
    CONSTRAINT scores_v40_politician_unique UNIQUE (politician_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scores_v40_total_score
    ON public.scores_v40(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_v40_calculated_at
    ON public.scores_v40(calculated_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.scores_v40 ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자 읽기 가능
CREATE POLICY "scores_v40_select_policy" ON public.scores_v40
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 쓰기 가능
CREATE POLICY "scores_v40_insert_policy" ON public.scores_v40
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "scores_v40_update_policy" ON public.scores_v40
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "scores_v40_delete_policy" ON public.scores_v40
    FOR DELETE
    USING (auth.role() = 'authenticated');


-- ===================================
-- 업데이트 트리거
-- ===================================

-- collected_data_v40 업데이트 트리거
CREATE OR REPLACE FUNCTION update_collected_data_v40_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collected_data_v40_updated_at_trigger
    BEFORE UPDATE ON public.collected_data_v40
    FOR EACH ROW
    EXECUTE FUNCTION update_collected_data_v40_updated_at();

-- evaluations_v40 업데이트 트리거
CREATE OR REPLACE FUNCTION update_evaluations_v40_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evaluations_v40_updated_at_trigger
    BEFORE UPDATE ON public.evaluations_v40
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluations_v40_updated_at();

-- scores_v40 업데이트 트리거
CREATE OR REPLACE FUNCTION update_scores_v40_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scores_v40_updated_at_trigger
    BEFORE UPDATE ON public.scores_v40
    FOR EACH ROW
    EXECUTE FUNCTION update_scores_v40_updated_at();


-- ===================================
-- 완료 메시지
-- ===================================
DO $$
BEGIN
    RAISE NOTICE 'V40 AI Evaluation Engine 테이블 생성 완료!';
    RAISE NOTICE '- collected_data_v40: 수집 데이터';
    RAISE NOTICE '- evaluations_v40: 평가 결과';
    RAISE NOTICE '- scores_v40: 최종 점수';
END $$;
