-- ============================================================================
-- PoliticianFinder V23.0 전용 스키마
-- ============================================================================
-- 작성일: 2025-11-20
-- 버전: V23.0
-- 핵심 특징:
--   - Prior 6.5, Coefficient 0.5
--   - 등급 범위: -8 ~ +8 (17단계)
--   - 카테고리 점수: 20 ~ 100점
--   - 최종 점수: 200 ~ 1000점
--   - 8단계 등급: M/D/E/P/G/S/B/I
--   - politician_id: INTEGER 타입 (UUID 아님!)
-- ============================================================================

-- ============================================================================
-- 1. V23 정치인 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS politicians_v23 (
  id TEXT PRIMARY KEY,  -- V23: TEXT ID (숫자/문자 모두 지원: "10001", "이재명", "OH_SEHOON" 등)
  name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50),
  party VARCHAR(100),
  region VARCHAR(200),
  current_position VARCHAR(200),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_politicians_v23_name ON politicians_v23(name);

-- ============================================================================
-- 2. V23 수집 데이터 테이블 (기존 collected_data와 호환)
-- ============================================================================
-- 주의: 이미 존재하는 collected_data 테이블 사용
-- politician_id를 TEXT 타입으로 저장 중 (INTEGER를 문자열로 변환)
-- 별도 테이블 생성 불필요

-- ============================================================================
-- 3. V23 카테고리 점수 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_category_scores_v23 (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL,  -- V23: TEXT (숫자/문자 모두 지원)
  ai_name VARCHAR(50) NOT NULL DEFAULT 'V23_Claude',
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  category_score DECIMAL(5,2) NOT NULL CHECK (category_score BETWEEN 20.00 AND 100.00),  -- V23: 20~100
  avg_rating DECIMAL(4,2),  -- -8 ~ +8 평균
  data_count INT DEFAULT 0,
  items_completed INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num)
);

CREATE INDEX IF NOT EXISTS idx_ai_category_v23_politician ON ai_category_scores_v23(politician_id);
CREATE INDEX IF NOT EXISTS idx_ai_category_v23_ai_name ON ai_category_scores_v23(ai_name);

-- ============================================================================
-- 4. V23 최종 점수 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_final_scores_v23 (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL,  -- V23: TEXT (숫자/문자 모두 지원)
  ai_name VARCHAR(50) NOT NULL DEFAULT 'V23_Claude',
  total_score DECIMAL(6,2) NOT NULL CHECK (total_score BETWEEN 200.00 AND 1000.00),  -- V23: 200~1000
  grade_code VARCHAR(1) NOT NULL,           -- M, D, E, P, G, S, B, I
  grade_name VARCHAR(20) NOT NULL,          -- Mugunghwa, Diamond, Emerald, etc.
  grade_emoji VARCHAR(10) NOT NULL,         -- 🌺, 💎, 💚, 🥇, 🥈, 🥉, ⚫
  categories_completed INT DEFAULT 0,
  items_completed INT DEFAULT 0,
  total_data_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name)
);

CREATE INDEX IF NOT EXISTS idx_ai_final_v23_politician ON ai_final_scores_v23(politician_id);
CREATE INDEX IF NOT EXISTS idx_ai_final_v23_score ON ai_final_scores_v23(total_score DESC);

-- ============================================================================
-- 5. V23 평가 진행 상태 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluation_status (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL UNIQUE,  -- V23: TEXT (숫자/문자 모두 지원)
  status VARCHAR(20) NOT NULL,  -- in_progress, completed, failed, partial
  current_step VARCHAR(100),
  progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_status_politician ON evaluation_status(politician_id);

-- ============================================================================
-- 6. 뷰 (View) - V23 전용
-- ============================================================================

-- 6.1 V23 최종 순위
CREATE OR REPLACE VIEW v_v23_rankings AS
SELECT
  p.id,
  p.name,
  p.job_type,
  p.party,
  p.region,
  f.total_score,
  f.grade_code,
  f.grade_name,
  f.grade_emoji,
  CONCAT(f.grade_emoji, ' ', f.grade_name, ' (', f.grade_code, ')') as grade_display,
  f.categories_completed,
  f.items_completed,
  f.total_data_count,
  RANK() OVER (ORDER BY f.total_score DESC) as rank
FROM politicians_v23 p
JOIN ai_final_scores_v23 f ON p.id = f.politician_id
WHERE f.ai_name = 'V23_Claude'
ORDER BY f.total_score DESC;

-- 6.2 V23 카테고리별 상세
CREATE OR REPLACE VIEW v_v23_category_details AS
SELECT
  p.id,
  p.name,
  c.category_num,
  CASE c.category_num
    WHEN 1 THEN 'Expertise (전문성)'
    WHEN 2 THEN 'Leadership (리더십)'
    WHEN 3 THEN 'Vision (비전)'
    WHEN 4 THEN 'Integrity (청렴성)'
    WHEN 5 THEN 'Ethics (윤리성)'
    WHEN 6 THEN 'Accountability (책임성)'
    WHEN 7 THEN 'Transparency (투명성)'
    WHEN 8 THEN 'Communication (소통능력)'
    WHEN 9 THEN 'Responsiveness (대응성)'
    WHEN 10 THEN 'PublicInterest (공익성)'
  END as category_name,
  c.category_score,
  c.avg_rating,
  c.data_count,
  c.items_completed
FROM politicians_v23 p
JOIN ai_category_scores_v23 c ON p.id = c.politician_id
WHERE c.ai_name = 'V23_Claude'
ORDER BY p.name, c.category_num;

-- ============================================================================
-- 7. 샘플 데이터
-- ============================================================================

-- V23_Upgrade 정치인 3명 (TEXT ID)
INSERT INTO politicians_v23 (id, name, job_type, party, region, current_position)
VALUES
  ('10001', '오세훈_V23_Upgrade', '광역단체장', '국민의힘', '서울특별시', '서울특별시장'),
  ('10002', '박주민_V23_Upgrade', '국회의원', '더불어민주당', '서울 은평구갑', '국회의원'),
  ('10004', '나경원_V23_Upgrade', '국회의원', '국민의힘', '서울 동작구을', '국회의원')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  job_type = EXCLUDED.job_type,
  party = EXCLUDED.party,
  region = EXCLUDED.region,
  current_position = EXCLUDED.current_position,
  updated_at = NOW();

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PoliticianFinder V23.0 Schema';
  RAISE NOTICE 'Installation Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - politicians_v23 (INTEGER ID)';
  RAISE NOTICE '  - ai_category_scores_v23 (20~100 scale)';
  RAISE NOTICE '  - ai_final_scores_v23 (200~1000 scale)';
  RAISE NOTICE '  - evaluation_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  - v_v23_rankings';
  RAISE NOTICE '  - v_v23_category_details';
  RAISE NOTICE '';
  RAISE NOTICE 'V23 Specifications:';
  RAISE NOTICE '  - Prior: 6.5';
  RAISE NOTICE '  - Coefficient: 0.5';
  RAISE NOTICE '  - Rating Range: -8 to +8';
  RAISE NOTICE '  - Category Score: 20 to 100';
  RAISE NOTICE '  - Final Score: 200 to 1000';
  RAISE NOTICE '  - Grades: M/D/E/P/G/S/B/I';
  RAISE NOTICE '============================================';
END $$;
