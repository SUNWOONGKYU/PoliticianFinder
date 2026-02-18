-- ============================================================
-- V30 점수 테이블 생성 SQL
-- 작성일: 2026-01-20
--
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 전체 복사 & 붙여넣기
-- 3. Run 버튼 클릭
-- ============================================================


-- ============================================================
-- 1. 카테고리 점수 테이블 (ai_category_scores_v30)
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
-- 2. 최종 점수 테이블 (ai_final_scores_v30)
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
-- 3. 등급 기준 참조 테이블 (선택사항)
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
-- 확인 쿼리
-- ============================================================
-- 테이블 목록 확인
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%v30%score%'
ORDER BY table_name;

-- 생성 완료!
