/**
 * Project Grid Task ID: P1D2-P1D5
 * 작업명: 정치인 데이터 스키마
 * 생성시간: 2025-10-31 14:25
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1D1
 * 설명: 정치인 및 평가 데이터 스키마
 */

-- ================================================
-- 정치인 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS public.politicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    party VARCHAR(100),
    position VARCHAR(100),
    district VARCHAR(100),
    profile_image_url TEXT,
    birth_date DATE,
    career TEXT[],
    education TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_politicians_name ON public.politicians(name);
CREATE INDEX idx_politicians_party ON public.politicians(party);
CREATE INDEX idx_politicians_district ON public.politicians(district);

-- ================================================
-- 평가 카테고리 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS public.evaluation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 평가 결과 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id UUID NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.evaluation_categories(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    grade VARCHAR(10),
    evaluated_by UUID REFERENCES public.profiles(id),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(politician_id, category_id)
);

CREATE INDEX idx_evaluations_politician_id ON public.evaluations(politician_id);
CREATE INDEX idx_evaluations_category_id ON public.evaluations(category_id);
CREATE INDEX idx_evaluations_score ON public.evaluations(score);

-- ================================================
-- 사용자 북마크 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    politician_id UUID NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, politician_id)
);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_politician_id ON public.bookmarks(politician_id);

-- ================================================
-- RLS 정책
-- ================================================

ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 정치인 정보 조회 가능
CREATE POLICY "Anyone can view politicians"
    ON public.politicians FOR SELECT
    USING (true);

-- 모든 사용자가 평가 카테고리 조회 가능
CREATE POLICY "Anyone can view categories"
    ON public.evaluation_categories FOR SELECT
    USING (true);

-- 모든 사용자가 평가 결과 조회 가능
CREATE POLICY "Anyone can view evaluations"
    ON public.evaluations FOR SELECT
    USING (true);

-- 사용자는 자신의 북마크만 조회/수정 가능
CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- 트리거
-- ================================================

CREATE TRIGGER update_politicians_updated_at
    BEFORE UPDATE ON public.politicians
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
