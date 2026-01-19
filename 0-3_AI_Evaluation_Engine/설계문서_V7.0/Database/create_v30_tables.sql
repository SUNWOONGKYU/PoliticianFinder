-- ============================================================
-- V30 테이블 생성 스크립트
-- 작성일: 2026-01-14
--
-- V30 핵심:
-- - 풀링 방식 (V26) + 등급 체계 (V28: +4 ~ -4)
-- - 4개 AI 웹검색 수집 (Perplexity 65%, Claude 15%, Gemini 15%, Grok 5%)
-- - 공식/공개 데이터 분리
-- - 카테고리당 100개 수집
--
-- 테이블 목록:
-- 1. politicians_v30 - 정치인 마스터
-- 2. collected_data_v30 - 수집 데이터
-- 3. evaluations_v30 - 평가 결과
-- 4. ai_category_scores_v30 - 카테고리별 점수
-- 5. ai_final_scores_v30 - 최종 점수
-- 6. grade_reference_v30 - 등급 기준 참조
-- ============================================================


-- ============================================================
-- 1. 정치인 테이블 (politicians_v30)
-- ============================================================
CREATE TABLE IF NOT EXISTS politicians_v30 (
    -- 기본 ID (8자리 hex, UUID 앞 8자리)
    id TEXT PRIMARY KEY,

    -- 기본 정보
    name TEXT NOT NULL,
    party TEXT,                          -- 소속 정당
    position TEXT,                       -- 직책/직위

    -- V30 확장 필드
    identity TEXT,                       -- 신분 (현직/출마예정자/전직 등)
    title TEXT,                          -- 현재 직책 상세
    region TEXT,                         -- 지역
    district TEXT,                       -- 지역구
    gender TEXT CHECK (gender IN ('남', '여')),
    birth_year INTEGER,                  -- 출생년도
    age INTEGER,                         -- 나이

    -- 연락처
    email TEXT,
    website TEXT,

    -- 이미지
    image_url TEXT,

    -- 평가 상태
    evaluation_status TEXT DEFAULT 'pending'
        CHECK (evaluation_status IN ('pending', 'collecting', 'evaluating', 'completed')),

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_v30_politicians_name ON politicians_v30(name);
CREATE INDEX IF NOT EXISTS idx_v30_politicians_party ON politicians_v30(party);
CREATE INDEX IF NOT EXISTS idx_v30_politicians_region ON politicians_v30(region);
CREATE INDEX IF NOT EXISTS idx_v30_politicians_status ON politicians_v30(evaluation_status);

-- 제약조건
ALTER TABLE politicians_v30 ADD CONSTRAINT politicians_v30_id_length
    CHECK (length(id) >= 6 AND length(id) <= 10);

-- 코멘트
COMMENT ON TABLE politicians_v30 IS 'V30 정치인 마스터 테이블';
COMMENT ON COLUMN politicians_v30.id IS '8자리 hex (UUID 앞 8자리)';
COMMENT ON COLUMN politicians_v30.evaluation_status IS 'pending → collecting → evaluating → completed';


-- ============================================================
-- 2. 수집 데이터 테이블 (collected_data_v30)
-- ============================================================
CREATE TABLE IF NOT EXISTS collected_data_v30 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,

    -- 카테고리 (10개)
    -- expertise, leadership, vision, integrity, ethics,
    -- consistency, crisis, communication, responsiveness, publicinterest
    category TEXT NOT NULL,

    -- 데이터 유형
    data_type TEXT NOT NULL CHECK (data_type IN ('official', 'public')),

    -- 수집 AI (4개)
    -- Perplexity (65%): 공식 50개 + 공개 15개
    -- Claude (15%): 공개 15개
    -- Gemini (15%): 공개 15개
    -- Grok (5%): 공개 5개 (X/트위터)
    collector_ai TEXT NOT NULL CHECK (collector_ai IN ('Perplexity', 'Claude', 'Gemini', 'Grok')),

    -- 수집 데이터
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_name TEXT,
    published_date DATE,

    -- 감성 분류 (수집 시 판단)
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),

    -- 검증 여부 (URL 유효성 등)
    is_verified BOOLEAN DEFAULT FALSE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_v30_collected_politician ON collected_data_v30(politician_id);
CREATE INDEX IF NOT EXISTS idx_v30_collected_category ON collected_data_v30(category);
CREATE INDEX IF NOT EXISTS idx_v30_collected_collector ON collected_data_v30(collector_ai);
CREATE INDEX IF NOT EXISTS idx_v30_collected_type ON collected_data_v30(data_type);
CREATE INDEX IF NOT EXISTS idx_v30_collected_url ON collected_data_v30(source_url);

-- 코멘트
COMMENT ON TABLE collected_data_v30 IS 'V30 수집 데이터 (4개 AI 웹검색, 풀링 방식)';
COMMENT ON COLUMN collected_data_v30.data_type IS 'official: 공식 데이터, public: 공개 데이터';
COMMENT ON COLUMN collected_data_v30.collector_ai IS '수집 AI (Perplexity 65%, Claude 15%, Gemini 15%, Grok 5%)';


-- ============================================================
-- 3. 평가 테이블 (evaluations_v30)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations_v30 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,

    -- 카테고리
    category TEXT NOT NULL,

    -- 평가 AI (4개)
    evaluator_ai TEXT NOT NULL CHECK (evaluator_ai IN ('Claude', 'ChatGPT', 'Gemini', 'Grok')),

    -- 평가 결과 (V28 등급 체계: +4 ~ -4)
    rating TEXT NOT NULL CHECK (rating IN ('+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4')),
    score INTEGER NOT NULL CHECK (score IN (8, 6, 4, 2, -2, -4, -6, -8)),

    -- 평가 근거
    reasoning TEXT,

    -- 메타데이터
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_v30_eval_politician ON evaluations_v30(politician_id);
CREATE INDEX IF NOT EXISTS idx_v30_eval_category ON evaluations_v30(category);
CREATE INDEX IF NOT EXISTS idx_v30_eval_evaluator ON evaluations_v30(evaluator_ai);

-- 코멘트
COMMENT ON TABLE evaluations_v30 IS 'V30 평가 결과 (풀링 평가, +4~-4 등급)';
COMMENT ON COLUMN evaluations_v30.rating IS 'V28 등급: +4(탁월) ~ -4(극히부족)';
COMMENT ON COLUMN evaluations_v30.score IS '점수 = 등급 × 2';


-- ============================================================
-- 4. 카테고리 점수 테이블 (ai_category_scores_v30)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_category_scores_v30 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,

    -- 카테고리
    category TEXT NOT NULL,

    -- 카테고리 점수 (20~100점)
    -- 공식: (PRIOR + avg_rating × COEFFICIENT) × 10
    -- PRIOR = 6.0, COEFFICIENT = 0.5
    score INTEGER NOT NULL CHECK (score >= 20 AND score <= 100),

    -- AI별 상세 점수 (JSON)
    -- {"Claude": 6.5, "ChatGPT": 5.2, "Gemini": 4.8, "Grok": 5.0}
    ai_details JSONB,

    -- 메타데이터
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_v30_cat_scores_politician ON ai_category_scores_v30(politician_id);
CREATE INDEX IF NOT EXISTS idx_v30_cat_scores_category ON ai_category_scores_v30(category);

-- 유니크 제약 (정치인 + 카테고리 조합은 유일)
CREATE UNIQUE INDEX IF NOT EXISTS idx_v30_cat_scores_unique
ON ai_category_scores_v30(politician_id, category);

-- 코멘트
COMMENT ON TABLE ai_category_scores_v30 IS 'V30 카테고리별 점수 (20~100점)';
COMMENT ON COLUMN ai_category_scores_v30.score IS '카테고리 점수: (6.0 + avg × 0.5) × 10';


-- ============================================================
-- 5. 최종 점수 테이블 (ai_final_scores_v30)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_final_scores_v30 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정치인 정보
    politician_id TEXT NOT NULL,
    politician_name TEXT NOT NULL,

    -- 최종 점수 (200~1000점)
    final_score INTEGER NOT NULL CHECK (final_score >= 200 AND final_score <= 1000),

    -- 최종 등급 (10단계)
    -- M(Mugunghwa), D(Diamond), E(Emerald), P(Platinum), G(Gold)
    -- S(Silver), B(Bronze), I(Iron), Tn(Tin), L(Lead)
    grade TEXT NOT NULL CHECK (grade IN ('M', 'D', 'E', 'P', 'G', 'S', 'B', 'I', 'Tn', 'L')),
    grade_name TEXT,

    -- 카테고리별 점수 (JSON)
    -- {"expertise": 75, "leadership": 68, ...}
    category_scores JSONB,

    -- 메타데이터
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    version TEXT DEFAULT 'V30'
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_v30_final_politician ON ai_final_scores_v30(politician_id);
CREATE INDEX IF NOT EXISTS idx_v30_final_grade ON ai_final_scores_v30(grade);
CREATE INDEX IF NOT EXISTS idx_v30_final_score ON ai_final_scores_v30(final_score DESC);

-- 유니크 제약 (정치인당 하나의 최종 점수)
CREATE UNIQUE INDEX IF NOT EXISTS idx_v30_final_unique
ON ai_final_scores_v30(politician_id);

-- 코멘트
COMMENT ON TABLE ai_final_scores_v30 IS 'V30 최종 점수 및 등급 (200~1000점, 10단계)';
COMMENT ON COLUMN ai_final_scores_v30.grade IS '10단계: M(920+), D(840+), E(760+), P(680+), G(600+), S(520+), B(440+), I(360+), Tn(280+), L(200+)';


-- ============================================================
-- 6. 등급 기준 참조 테이블 (선택사항)
-- ============================================================
CREATE TABLE IF NOT EXISTS grade_reference_v30 (
    grade TEXT PRIMARY KEY,
    grade_name TEXT NOT NULL,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    description TEXT
);

-- 등급 기준 데이터 삽입
INSERT INTO grade_reference_v30 (grade, grade_name, min_score, max_score, description)
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
-- 7. Foreign Key 제약조건 (선택사항)
-- ============================================================
-- 주의: Foreign Key는 데이터 무결성을 보장하지만,
--       데이터 삽입 순서에 제약이 생김.
--       필요시 아래 주석 해제하여 사용.

-- ALTER TABLE collected_data_v30
--     ADD CONSTRAINT fk_collected_politician
--     FOREIGN KEY (politician_id) REFERENCES politicians_v30(id);

-- ALTER TABLE evaluations_v30
--     ADD CONSTRAINT fk_evaluations_politician
--     FOREIGN KEY (politician_id) REFERENCES politicians_v30(id);

-- ALTER TABLE ai_category_scores_v30
--     ADD CONSTRAINT fk_cat_scores_politician
--     FOREIGN KEY (politician_id) REFERENCES politicians_v30(id);

-- ALTER TABLE ai_final_scores_v30
--     ADD CONSTRAINT fk_final_scores_politician
--     FOREIGN KEY (politician_id) REFERENCES politicians_v30(id);


-- ============================================================
-- 확인 쿼리
-- ============================================================
-- 테이블 목록 확인
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%v30%'
ORDER BY table_name;


-- ============================================================
-- 테이블 구조 요약
-- ============================================================
/*
V30 테이블 구조:

1. politicians_v30 (정치인 마스터)
   - id TEXT (PK, 8자리 hex)
   - name, party, position, identity, title, region, district
   - gender, birth_year, age
   - email, website, image_url
   - evaluation_status (pending → collecting → evaluating → completed)

2. collected_data_v30 (수집 데이터)
   - politician_id, category
   - data_type (official/public)
   - collector_ai (Perplexity 65%, Claude 15%, Gemini 15%, Grok 5%)
   - title, content, source_url, source_name, published_date
   - sentiment (positive/negative/neutral)

3. evaluations_v30 (평가 결과)
   - politician_id, category
   - evaluator_ai (Claude, ChatGPT, Gemini, Grok)
   - rating (+4 ~ -4), score (등급 × 2)
   - reasoning

4. ai_category_scores_v30 (카테고리 점수)
   - politician_id, category
   - score (20~100점)
   - ai_details (JSONB)

5. ai_final_scores_v30 (최종 점수)
   - politician_id
   - final_score (200~1000점)
   - grade (M/D/E/P/G/S/B/I/Tn/L)
   - category_scores (JSONB)

6. grade_reference_v30 (등급 기준)
   - grade, grade_name, min_score, max_score, description
*/
