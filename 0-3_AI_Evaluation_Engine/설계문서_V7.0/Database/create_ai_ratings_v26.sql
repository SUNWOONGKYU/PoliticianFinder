-- ============================================================
-- V26.0 풀링 시스템용 ai_ratings_v26 테이블 생성
--
-- 용도: 평가 결과 저장 (카테고리당 800개 = 4 AI × 200개)
-- 생성일: 2026-01-04
-- ============================================================

-- 기존 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS ai_ratings_v26;

-- ai_ratings_v26 테이블 생성
CREATE TABLE IF NOT EXISTS ai_ratings_v26 (
    -- PK
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 데이터 참조 (collected_data_v26의 데이터를 참조)
    collected_data_id UUID NOT NULL,

    -- 평가자 정보
    evaluator_ai_name TEXT NOT NULL,  -- 평가한 AI (Claude, ChatGPT, Grok, Gemini)

    -- 평가 대상 정보 (collected_data에서 복사)
    politician_id TEXT NOT NULL,
    category_name TEXT NOT NULL,

    -- 평가 결과
    rating TEXT NOT NULL CHECK (rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
    rating_rationale TEXT,

    -- 메타데이터
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evaluation_version TEXT DEFAULT 'V26.0',

    -- 원본 수집자 정보 (참고용)
    original_collector_ai TEXT,  -- 원래 수집한 AI

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ratings_v26_politician_id
    ON ai_ratings_v26(politician_id);

CREATE INDEX IF NOT EXISTS idx_ratings_v26_evaluator_ai
    ON ai_ratings_v26(evaluator_ai_name);

CREATE INDEX IF NOT EXISTS idx_ratings_v26_category
    ON ai_ratings_v26(category_name);

CREATE INDEX IF NOT EXISTS idx_ratings_v26_collected_data
    ON ai_ratings_v26(collected_data_id);

-- 복합 인덱스 (자주 사용하는 조회 패턴)
CREATE INDEX IF NOT EXISTS idx_ratings_v26_politician_evaluator_category
    ON ai_ratings_v26(politician_id, evaluator_ai_name, category_name);

-- 코멘트
COMMENT ON TABLE ai_ratings_v26 IS 'V26.0 풀링 시스템 - 평가 결과 저장 (카테고리당 4 AI × 200개 = 800개)';
COMMENT ON COLUMN ai_ratings_v26.evaluator_ai_name IS '평가를 수행한 AI 이름 (Claude, ChatGPT, Grok, Gemini)';
COMMENT ON COLUMN ai_ratings_v26.original_collector_ai IS '원본 데이터를 수집한 AI 이름';
COMMENT ON COLUMN ai_ratings_v26.rating IS '알파벳 등급 (A=8, B=6, C=4, D=2, E=-2, F=-4, G=-6, H=-8)';

-- ============================================================
-- collected_data_v26 테이블 수정 (rating 필드 NULL 허용)
-- ============================================================

-- 기존 데이터가 있는 경우 rating 컬럼을 NULL 허용으로 변경
ALTER TABLE collected_data_v26
    ALTER COLUMN rating DROP NOT NULL;

-- rating 필드에 대한 코멘트 추가
COMMENT ON COLUMN collected_data_v26.rating IS
    '풀링 방식: 수집 단계에서는 NULL, 평가 단계에서 ai_ratings_v26에 저장';

-- ============================================================
-- 확인 쿼리
-- ============================================================

-- 테이블 생성 확인
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'ai_ratings_v26';

-- 테이블 구조 확인
-- \d ai_ratings_v26;
