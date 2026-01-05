-- ============================================================================
-- politician_scores 테이블 생성 스크립트
-- V15.0 점수 계산 결과 저장
-- ============================================================================

-- 기존 테이블이 있다면 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS politician_scores;

-- politician_scores 테이블 생성
CREATE TABLE politician_scores (
  -- 기본 키
  politician_id INT PRIMARY KEY,

  -- 카테고리별 평균 Rating (10개)
  category_1_avg_rating DECIMAL(4,2),    -- 전문성 (Expertise)
  category_2_avg_rating DECIMAL(4,2),    -- 리더십 (Leadership)
  category_3_avg_rating DECIMAL(4,2),    -- 비전 (Vision)
  category_4_avg_rating DECIMAL(4,2),    -- 청렴성 (Integrity)
  category_5_avg_rating DECIMAL(4,2),    -- 윤리성 (Ethics)
  category_6_avg_rating DECIMAL(4,2),    -- 책임성 (Accountability)
  category_7_avg_rating DECIMAL(4,2),    -- 투명성 (Transparency)
  category_8_avg_rating DECIMAL(4,2),    -- 소통능력 (Communication)
  category_9_avg_rating DECIMAL(4,2),    -- 대응성 (Responsiveness)
  category_10_avg_rating DECIMAL(4,2),   -- 공익성 (PublicInterest)

  -- 카테고리별 점수 (10개) - 30~110점
  category_1_score DECIMAL(5,2),
  category_2_score DECIMAL(5,2),
  category_3_score DECIMAL(5,2),
  category_4_score DECIMAL(5,2),
  category_5_score DECIMAL(5,2),
  category_6_score DECIMAL(5,2),
  category_7_score DECIMAL(5,2),
  category_8_score DECIMAL(5,2),
  category_9_score DECIMAL(5,2),
  category_10_score DECIMAL(5,2),

  -- 최종 점수 (300~1000점)
  raw_final_score DECIMAL(6,2),         -- 원점수 (1,000점 초과 가능)
  final_score DECIMAL(6,2) NOT NULL     -- 최종 점수 (1,000점 상한)
    CHECK (final_score >= 300 AND final_score <= 1000),

  -- 등급 (8단계 금속 등급)
  grade VARCHAR(1) NOT NULL
    CHECK (grade IN ('I','B','S','G','P','E','D','M')),

  -- 수집된 데이터 개수
  total_data_count INT,                  -- 총 데이터 개수 (목표: 500개)
  official_data_count INT,               -- OFFICIAL 데이터 개수
  public_data_count INT,                 -- PUBLIC 데이터 개수

  -- 메타 정보
  version VARCHAR(10) DEFAULT 'V15.0',   -- 알고리즘 버전
  calculated_at TIMESTAMP DEFAULT NOW(), -- 계산 일시
  updated_at TIMESTAMP DEFAULT NOW()     -- 업데이트 일시
);

-- 인덱스 생성
CREATE INDEX idx_politician_scores_grade ON politician_scores(grade);
CREATE INDEX idx_politician_scores_final_score ON politician_scores(final_score DESC);

-- 코멘트 추가
COMMENT ON TABLE politician_scores IS 'V15.0 정치인 AI 평가 점수 (300~1000점, Rating -6~+10)';
COMMENT ON COLUMN politician_scores.politician_id IS '정치인 ID (FK to politicians.id)';
COMMENT ON COLUMN politician_scores.final_score IS '최종 점수 (1,000점 상한 적용)';
COMMENT ON COLUMN politician_scores.grade IS '등급: I(900~1000) B(800~899) S(700~799) G(600~699) P(500~599) E(450~499) D(425~449) M(400~424)';

-- ============================================================================
-- V23.0 점수 계산 공식
-- ============================================================================
-- Prior = 6.5
-- Coefficient = 0.5
-- Rating Range = A~-A (8단계 알파벳)
--
-- category_score = (6.5 + avg_rating × 0.5) × 10
-- raw_final_score = SUM(category_1_score ~ category_10_score)
-- final_score = MIN(raw_final_score, 1000)
-- ============================================================================

-- 샘플 데이터 삽입 예시
/*
INSERT INTO politician_scores (
  politician_id,
  category_1_score, category_2_score, category_3_score, category_4_score, category_5_score,
  category_6_score, category_7_score, category_8_score, category_9_score, category_10_score,
  final_score, grade, total_data_count
) VALUES (
  1,
  75.0, 72.5, 70.0, 68.0, 65.0,
  63.0, 60.0, 58.0, 55.0, 52.0,
  638.5, 'G', 500
);
*/
