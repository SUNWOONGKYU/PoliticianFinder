-- ============================================================================
-- ai_evaluations 테이블 재설계
-- 목적: 멀티 AI 종합 평가 저장
-- 작성일: 2025-11-20
-- ============================================================================

-- 기존 테이블 삭제 후 재생성
DROP TABLE IF EXISTS ai_evaluations CASCADE;

CREATE TABLE ai_evaluations (
    politician_id TEXT PRIMARY KEY          -- 관리자 지정 ID (10자 이내, 영문/숫자/기호)
                  CHECK (length(politician_id) <= 10 AND length(politician_id) > 0),

    -- AI 모델 정보
    ai_count INT NOT NULL,                  -- 참여 AI 개수

    -- 종합 점수 (소수점 반올림)
    avg_score INT NOT NULL,                 -- 평균 점수 (200~1000, 정수)

    -- 등급 정보
    grade_code TEXT NOT NULL,               -- 등급 코드 (M/D/E/P/G/S/B/I)
    grade_name TEXT NOT NULL,               -- 등급 이름 (Mugunghwa, Diamond, Emerald...)
    grade_emoji TEXT NOT NULL,              -- 등급 이모지 (🌺, 💎, 💚...)

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 점수 순위 조회용 인덱스
CREATE INDEX idx_ai_evaluations_avg_score ON ai_evaluations(avg_score DESC);

-- ============================================================================
-- 사용 예시
-- ============================================================================
-- INSERT INTO ai_evaluations (politician_id, ai_count, avg_score, grade_code, grade_name, grade_emoji)
-- VALUES ('10001', 3, 822, 'B', 'Bronze', '🥉');
--
-- 조회:
-- SELECT * FROM ai_evaluations WHERE politician_id = '10001';
-- SELECT * FROM ai_evaluations ORDER BY avg_score DESC LIMIT 10;
-- ============================================================================

COMMENT ON TABLE ai_evaluations IS '멀티 AI 종합 평가 테이블';
COMMENT ON COLUMN ai_evaluations.politician_id IS '정치인 ID (관리자 지정, 10자 이내, 영문/숫자/기호)';
COMMENT ON COLUMN ai_evaluations.ai_count IS '참여 AI 개수';
COMMENT ON COLUMN ai_evaluations.avg_score IS '여러 AI의 평균 점수 (정수, 소수점 반올림)';
COMMENT ON COLUMN ai_evaluations.grade_code IS '등급 코드 (M/D/E/P/G/S/B/I)';
COMMENT ON COLUMN ai_evaluations.grade_name IS '등급 이름';
COMMENT ON COLUMN ai_evaluations.grade_emoji IS '등급 이모지';

-- ============================================================================
-- ID 규칙:
-- - 길이: 1~10자
-- - 구성: 영문, 숫자, 언더스코어(_), 하이픈(-) 허용
-- - 예시: '10001', 'OH_001', 'LEE-2024', 'V23_OH'
-- - 관리자가 등록 시 직접 지정
-- ============================================================================
