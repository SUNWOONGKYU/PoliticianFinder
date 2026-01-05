-- ============================================================
-- V26.0 신규 테이블 생성 SQL
-- ============================================================
-- 목적: 기존 V24 테이블 유지하면서 V26용 새 테이블 생성
-- 프로덕션: 기존 테이블 (collected_data 등) 계속 사용
-- V26 수집: 새 테이블 (collected_data_v26 등)에 저장
-- ============================================================

-- ============================================================
-- STEP 1: V26 수집 데이터 테이블
-- ============================================================

-- 1-1. collected_data_v26 (V26 수집 데이터)
CREATE TABLE IF NOT EXISTS collected_data_v26 (
    collected_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,  -- 'Claude', 'ChatGPT', 'Grok', 'Gemini'
    category_name VARCHAR(50) NOT NULL,
    item_num INTEGER NOT NULL CHECK (item_num >= 1 AND item_num <= 60),
    data_title TEXT NOT NULL,
    data_content TEXT NOT NULL,
    data_source TEXT,
    source_url TEXT,
    collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rating VARCHAR(1) NOT NULL CHECK (rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
    rating_rationale TEXT,
    source_type VARCHAR(20) CHECK (source_type IN ('OFFICIAL', 'PUBLIC')),

    -- V26.0 추가 필드
    collection_version VARCHAR(10) DEFAULT 'V26.0',
    official_date_start DATE,  -- OFFICIAL 기간 시작 (4년 전)
    official_date_end DATE,    -- OFFICIAL 기간 종료 (평가일)
    public_date_start DATE,    -- PUBLIC 기간 시작 (1년 전)
    public_date_end DATE,      -- PUBLIC 기간 종료 (평가일)

    UNIQUE(politician_id, ai_name, category_name, item_num)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_collected_v26_politician ON collected_data_v26(politician_id);
CREATE INDEX IF NOT EXISTS idx_collected_v26_ai ON collected_data_v26(ai_name);
CREATE INDEX IF NOT EXISTS idx_collected_v26_category ON collected_data_v26(category_name);

-- ============================================================
-- STEP 2: V26 카테고리 점수 테이블
-- ============================================================

-- 2-1. ai_category_scores_v26
CREATE TABLE IF NOT EXISTS ai_category_scores_v26 (
    score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    category_name VARCHAR(50) NOT NULL,
    category_score NUMERIC(5,2) NOT NULL,
    data_count INTEGER DEFAULT 50,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(politician_id, ai_name, category_name)
);

CREATE INDEX IF NOT EXISTS idx_cat_scores_v26_politician ON ai_category_scores_v26(politician_id);

-- ============================================================
-- STEP 3: V26 AI별 최종 점수 테이블
-- ============================================================

-- 3-1. ai_final_scores_v26
CREATE TABLE IF NOT EXISTS ai_final_scores_v26 (
    score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    total_score INTEGER NOT NULL,
    grade_code VARCHAR(5) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(politician_id, ai_name)
);

CREATE INDEX IF NOT EXISTS idx_final_scores_v26_politician ON ai_final_scores_v26(politician_id);

-- ============================================================
-- STEP 4: V26 종합 평가 테이블
-- ============================================================

-- 4-1. ai_evaluations_v26
CREATE TABLE IF NOT EXISTS ai_evaluations_v26 (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_count INTEGER DEFAULT 4,  -- V26: 4개 AI
    avg_score NUMERIC(6,2) NOT NULL,
    grade_code VARCHAR(5) NOT NULL,
    rank_overall INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(politician_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_v26_politician ON ai_evaluations_v26(politician_id);

-- ============================================================
-- STEP 5: RLS 정책 (Row Level Security)
-- ============================================================

-- 모든 V26 테이블에 RLS 활성화
ALTER TABLE collected_data_v26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_category_scores_v26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_final_scores_v26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations_v26 ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모두 읽기 가능)
CREATE POLICY "V26 collected_data readable by all"
ON collected_data_v26 FOR SELECT USING (true);

CREATE POLICY "V26 category_scores readable by all"
ON ai_category_scores_v26 FOR SELECT USING (true);

CREATE POLICY "V26 final_scores readable by all"
ON ai_final_scores_v26 FOR SELECT USING (true);

CREATE POLICY "V26 evaluations readable by all"
ON ai_evaluations_v26 FOR SELECT USING (true);

-- 쓰기 정책 (service role만)
CREATE POLICY "V26 collected_data writable by service"
ON collected_data_v26 FOR INSERT WITH CHECK (true);

CREATE POLICY "V26 category_scores writable by service"
ON ai_category_scores_v26 FOR INSERT WITH CHECK (true);

CREATE POLICY "V26 final_scores writable by service"
ON ai_final_scores_v26 FOR INSERT WITH CHECK (true);

CREATE POLICY "V26 evaluations writable by service"
ON ai_evaluations_v26 FOR INSERT WITH CHECK (true);

-- ============================================================
-- STEP 6: 확인 쿼리
-- ============================================================

SELECT
    'collected_data_v26' as table_name,
    (SELECT COUNT(*) FROM collected_data_v26) as count
UNION ALL
SELECT
    'ai_category_scores_v26',
    (SELECT COUNT(*) FROM ai_category_scores_v26)
UNION ALL
SELECT
    'ai_final_scores_v26',
    (SELECT COUNT(*) FROM ai_final_scores_v26)
UNION ALL
SELECT
    'ai_evaluations_v26',
    (SELECT COUNT(*) FROM ai_evaluations_v26);

-- ============================================================
-- 완료!
-- ============================================================
-- 생성된 테이블:
--   - collected_data_v26 (V26 수집 데이터)
--   - ai_category_scores_v26 (카테고리별 점수)
--   - ai_final_scores_v26 (AI별 최종 점수)
--   - ai_evaluations_v26 (종합 평가)
--
-- 기존 테이블 (프로덕션 유지):
--   - collected_data (V24 데이터)
--   - ai_category_scores
--   - ai_final_scores
--   - ai_evaluations
--
-- 검증 완료 후 테이블 교체 방법:
--   1. 뷰(View) 사용하여 연결 변경
--   2. 또는 테이블 이름 변경 (RENAME)
-- ============================================================
