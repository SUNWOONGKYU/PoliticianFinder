-- ============================================================
-- V40 테이블 생성 스크립트
-- 작성일: 2026-02-01
--
-- V40 핵심:
-- - Perplexity 제거, Naver Search API 도입
-- - 2개 채널 수집: Gemini 50% + Naver 50%
-- - 4개 AI 평가: Claude, ChatGPT, Gemini, Grok
-- - 카테고리당 100개 수집 (버퍼 20% 포함 최대 120개)
-- - OFFICIAL 40개 (Gemini 30 + Naver 10)
-- - PUBLIC 60개 (Gemini 20 + Naver 40)
--
-- 테이블 목록:
-- 1. politicians_v40 - 정치인 마스터
-- 2. collected_data_v40 - 수집 데이터
-- 3. evaluations_v40 - 평가 결과
-- 4. ai_category_scores_v40 - 카테고리별 점수
-- 5. ai_final_scores_v40 - 최종 점수
-- 6. grade_reference_v40 - 등급 기준 참조
-- ============================================================


-- ============================================================
-- 1. 정치인 테이블 (politicians_v40)
-- ============================================================
CREATE TABLE IF NOT EXISTS politicians_v40 (
    -- 필수 기본 정보 (2개)
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,

    -- 정치 정보 (6개)
    party TEXT,
    position TEXT,
    identity TEXT,
    title TEXT,
    region TEXT,
    district TEXT,

    -- 개인 정보 (3개)
    gender TEXT CHECK (gender IN ('남', '여')),
    birth_year INTEGER,
    age INTEGER,

    -- 상태 관리 (1개)
    evaluation_status TEXT DEFAULT 'pending'
        CHECK (evaluation_status IN ('pending', 'collecting', 'evaluating', 'completed')),

    -- 메타데이터 (2개)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()

    -- ⚠️ 삭제된 필드 (평가 무관):
    -- email TEXT (웹사이트 프로필용)
    -- website TEXT (웹사이트 프로필용)
    -- image_url TEXT (웹사이트 프로필용)
    -- → 일반 politicians 테이블에 있어야 함
);

CREATE INDEX IF NOT EXISTS idx_v40_politicians_name ON politicians_v40(name);
CREATE INDEX IF NOT EXISTS idx_v40_politicians_party ON politicians_v40(party);
CREATE INDEX IF NOT EXISTS idx_v40_politicians_region ON politicians_v40(region);
CREATE INDEX IF NOT EXISTS idx_v40_politicians_status ON politicians_v40(evaluation_status);

ALTER TABLE politicians_v40 ADD CONSTRAINT politicians_v40_id_length
    CHECK (length(id) >= 6 AND length(id) <= 10);

COMMENT ON TABLE politicians_v40 IS 'V40 정치인 마스터 테이블 (평가 전용 - 14개 필드)';
COMMENT ON COLUMN politicians_v40.id IS '8자리 hex (UUID 앞 8자리)';
COMMENT ON COLUMN politicians_v40.identity IS '출마 신분: 현직/후보자/예비후보자/출마예정자/출마자';
COMMENT ON COLUMN politicians_v40.title IS '출마 직종: 국회의원/광역단체장/광역의원/기초단체장/기초의원/교육감';


-- ============================================================
-- 2. 수집 데이터 테이블 (collected_data_v40)
-- ============================================================
CREATE TABLE IF NOT EXISTS collected_data_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,

    -- 카테고리 (10개)
    category TEXT NOT NULL,

    -- 데이터 유형
    data_type TEXT NOT NULL CHECK (data_type IN ('official', 'public')),

    -- 수집 채널 (2개만!)
    -- Gemini (50%): OFFICIAL 30개 + PUBLIC 20개
    -- Naver (50%): OFFICIAL 10개 + PUBLIC 40개
    collector_ai TEXT NOT NULL CHECK (collector_ai IN ('Gemini', 'Naver')),

    -- 수집 데이터
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    source_url TEXT NOT NULL,
    source_name TEXT,
    published_date DATE,

    -- 감성 분류
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'free')),

    -- 검증 여부
    is_verified BOOLEAN DEFAULT FALSE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v40_collected_politician ON collected_data_v40(politician_id);
CREATE INDEX IF NOT EXISTS idx_v40_collected_category ON collected_data_v40(category);
CREATE INDEX IF NOT EXISTS idx_v40_collected_collector ON collected_data_v40(collector_ai);
CREATE INDEX IF NOT EXISTS idx_v40_collected_type ON collected_data_v40(data_type);
CREATE INDEX IF NOT EXISTS idx_v40_collected_url ON collected_data_v40(source_url);

COMMENT ON TABLE collected_data_v40 IS 'V40 수집 데이터 (Gemini 50% + Naver 50%)';
COMMENT ON COLUMN collected_data_v40.data_type IS 'official: 공식 데이터, public: 공개 데이터';
COMMENT ON COLUMN collected_data_v40.collector_ai IS '수집 채널: Gemini 50% + Naver 50% (Perplexity 제거)';


-- ============================================================
-- 3. 평가 테이블 (evaluations_v40)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,
    category TEXT NOT NULL,

    -- 평가 AI (4개)
    evaluator_ai TEXT NOT NULL CHECK (evaluator_ai IN ('Claude', 'ChatGPT', 'Gemini', 'Grok')),

    -- 수집 데이터 연결 (평가 추적용)
    collected_data_id UUID REFERENCES collected_data_v40(id),

    -- 평가 결과 (+4 ~ -4, X=평가제외)
    -- ⚠️ score는 저장하지 않음 — calculate_v40_scores.py가 rating에서 직접 계산 (단독 책임)
    rating TEXT NOT NULL CHECK (rating IN ('+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X')),

    reasoning TEXT,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v40_eval_politician ON evaluations_v40(politician_id);
CREATE INDEX IF NOT EXISTS idx_v40_eval_category ON evaluations_v40(category);
CREATE INDEX IF NOT EXISTS idx_v40_eval_evaluator ON evaluations_v40(evaluator_ai);

-- 동일 AI가 동일 데이터를 중복 평가하는 것 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_v40_eval_no_duplicate
ON evaluations_v40(politician_id, evaluator_ai, category, collected_data_id);

COMMENT ON TABLE evaluations_v40 IS 'V40 평가 결과 (4개 AI, +4~-4 등급)';


-- ============================================================
-- 4. 카테고리 점수 테이블 (ai_category_scores_v40)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_category_scores_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,
    category TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 20 AND score <= 100),
    ai_details JSONB,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v40_cat_scores_politician ON ai_category_scores_v40(politician_id);
CREATE INDEX IF NOT EXISTS idx_v40_cat_scores_category ON ai_category_scores_v40(category);

CREATE UNIQUE INDEX IF NOT EXISTS idx_v40_cat_scores_unique
ON ai_category_scores_v40(politician_id, category);

COMMENT ON TABLE ai_category_scores_v40 IS 'V40 카테고리별 점수 (20~100점)';


-- ============================================================
-- 5. 최종 점수 테이블 (ai_final_scores_v40)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_final_scores_v40 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,
    final_score INTEGER NOT NULL CHECK (final_score >= 200 AND final_score <= 1000),
    grade TEXT NOT NULL CHECK (grade IN ('M', 'D', 'E', 'P', 'G', 'S', 'B', 'I', 'Tn', 'L')),
    grade_name TEXT,
    category_scores JSONB,
    ai_category_scores JSONB,
    ai_final_scores JSONB,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    version TEXT DEFAULT 'V40'
);

CREATE INDEX IF NOT EXISTS idx_v40_final_politician ON ai_final_scores_v40(politician_id);
CREATE INDEX IF NOT EXISTS idx_v40_final_grade ON ai_final_scores_v40(grade);
CREATE INDEX IF NOT EXISTS idx_v40_final_score ON ai_final_scores_v40(final_score DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_v40_final_unique
ON ai_final_scores_v40(politician_id);

COMMENT ON TABLE ai_final_scores_v40 IS 'V40 최종 점수 및 등급 (200~1000점, 10단계)';


-- ============================================================
-- 6. 등급 기준 참조 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS grade_reference_v40 (
    grade TEXT PRIMARY KEY,
    grade_name TEXT NOT NULL,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    description TEXT
);

INSERT INTO grade_reference_v40 (grade, grade_name, min_score, max_score, description)
VALUES
    ('M', 'Mugunghwa', 920, 1000, '최우수'),
    ('D', 'Diamond', 840, 919, '우수'),
    ('E', 'Emerald', 760, 839, '양호'),
    ('P', 'Platinum', 680, 759, '보통+'),
    ('G', 'Gold', 600, 679, '보통'),
    ('S', 'Silver', 520, 599, '보통-'),
    ('B', 'Bronze', 440, 519, '미흡'),
    ('I', 'Iron', 360, 439, '부족'),
    ('Tn', 'Tin', 280, 359, '상당히 부족'),
    ('L', 'Lead', 200, 279, '매우 부족')
ON CONFLICT (grade) DO NOTHING;


-- ============================================================
-- 7. 마이그레이션: 기존 라이브 DB 수정 (이미 테이블이 있는 경우)
-- ============================================================

-- [NEW] politicians_v40: 평가 무관 필드 제거 (email, website, image_url)
-- 이 필드들은 일반 politicians 테이블에 있어야 하며, V40 평가와 무관함
ALTER TABLE politicians_v40 DROP COLUMN IF EXISTS email;
ALTER TABLE politicians_v40 DROP COLUMN IF EXISTS website;
ALTER TABLE politicians_v40 DROP COLUMN IF EXISTS image_url;

-- [CRITICAL 1] evaluations_v40: score 컬럼 제거
-- score는 calculate_v40_scores.py가 rating에서 직접 계산 (단독 책임)
ALTER TABLE evaluations_v40 DROP COLUMN IF EXISTS score;

-- [CRITICAL 2] evaluations_v40: collected_data_id 컬럼 추가
ALTER TABLE evaluations_v40
    ADD COLUMN IF NOT EXISTS collected_data_id UUID REFERENCES collected_data_v40(id);

CREATE INDEX IF NOT EXISTS idx_v40_eval_collected_data
    ON evaluations_v40(collected_data_id);

-- [FIX 4] evaluations_v40: 동일 AI 중복 평가 방지 UNIQUE 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_v40_eval_no_duplicate
    ON evaluations_v40(politician_id, evaluator_ai, category, collected_data_id);

-- [CRITICAL 3] ai_final_scores_v40: AI별 점수 컬럼 추가
ALTER TABLE ai_final_scores_v40
    ADD COLUMN IF NOT EXISTS ai_category_scores JSONB;
ALTER TABLE ai_final_scores_v40
    ADD COLUMN IF NOT EXISTS ai_final_scores JSONB;


-- ============================================================
-- 확인 쿼리
-- ============================================================
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%v40%'
ORDER BY table_name;
