-- ============================================================================
-- PoliticianFinder AI Evaluation Engine V2.0
-- Supabase Schema (PostgreSQL)
-- ============================================================================
-- 작성일: 2025-10-26
-- 버전: 2.0
-- 핵심 특징:
--   - Bayesian Prior 7.0 적용 (±3점 범위 보장: 4.0~10.0)
--   - 8단계 등급 체계 (M/D/E/P/G/S/B/I)
--   - 5개 AI 독립 평가 + 종합 점수
--   - 실시간 자동 점수 계산 (트리거)
-- ============================================================================

-- ============================================================================
-- 1. 테이블 생성
-- ============================================================================

-- 1.1 정치인 기본 정보
CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL,  -- 국회의원, 광역단체장, 광역의원, 기초단체장, 기초의원
  party VARCHAR(100),
  region VARCHAR(200),
  current_position VARCHAR(200),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_politicians_name ON politicians(name);
CREATE INDEX idx_politicians_job_type ON politicians(job_type);
CREATE INDEX idx_politicians_party ON politicians(party);

-- ============================================================================
-- 1.2 수집된 원본 데이터 (AI별 독립 수집)
CREATE TABLE IF NOT EXISTS collected_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,    -- Claude, ChatGPT, Gemini, Grok, Perplexity
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  item_num INT NOT NULL CHECK (item_num BETWEEN 1 AND 10),
  data_type VARCHAR(50),           -- 뉴스, 공식기록, 통계, SNS 등
  data_title VARCHAR(500),
  data_content TEXT,
  data_url VARCHAR(500),
  data_score DECIMAL(4,3) NOT NULL CHECK (data_score BETWEEN 0.000 AND 1.000),
  reliability DECIMAL(3,2) CHECK (reliability BETWEEN 0.00 AND 1.00),
  collected_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_data_politician ON collected_data(politician_id);
CREATE INDEX idx_data_ai_name ON collected_data(ai_name);
CREATE INDEX idx_data_category_item ON collected_data(category_num, item_num);
CREATE INDEX idx_data_politician_ai ON collected_data(politician_id, ai_name);

-- ============================================================================
-- 1.3 AI별 항목 점수 (Bayesian Prior 7.0 적용)
CREATE TABLE IF NOT EXISTS ai_item_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  item_num INT NOT NULL CHECK (item_num BETWEEN 1 AND 10),
  item_score DECIMAL(4,2) NOT NULL CHECK (item_score BETWEEN 4.00 AND 10.00),  -- ±3점 범위
  data_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num, item_num)
);

-- 인덱스
CREATE INDEX idx_ai_item_politician ON ai_item_scores(politician_id);
CREATE INDEX idx_ai_item_ai_name ON ai_item_scores(ai_name);
CREATE INDEX idx_ai_item_category ON ai_item_scores(category_num);

-- ============================================================================
-- 1.4 AI별 분야 점수
CREATE TABLE IF NOT EXISTS ai_category_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  category_score DECIMAL(4,2) NOT NULL CHECK (category_score BETWEEN 4.00 AND 10.00),
  items_completed INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num)
);

-- 인덱스
CREATE INDEX idx_ai_category_politician ON ai_category_scores(politician_id);
CREATE INDEX idx_ai_category_ai_name ON ai_category_scores(ai_name);

-- ============================================================================
-- 1.5 AI별 최종 점수
CREATE TABLE IF NOT EXISTS ai_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  total_score DECIMAL(5,1) NOT NULL CHECK (total_score BETWEEN 40.0 AND 100.0),
  grade_code VARCHAR(1) NOT NULL,           -- M, D, E, P, G, S, B, I
  grade_name VARCHAR(20) NOT NULL,          -- Mugunghwa, Diamond, Emerald, etc.
  grade_emoji VARCHAR(10) NOT NULL,         -- 🌺, 💎, 💚, 🥇, 🥈, 🥉, ⚫
  categories_completed INT DEFAULT 0,
  items_completed INT DEFAULT 0,
  total_data_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name)
);

-- 인덱스
CREATE INDEX idx_ai_final_politician ON ai_final_scores(politician_id);
CREATE INDEX idx_ai_final_ai_name ON ai_final_scores(ai_name);
CREATE INDEX idx_ai_final_score ON ai_final_scores(total_score DESC);

-- ============================================================================
-- 1.6 종합 최종 점수 (5개 AI 평균)
CREATE TABLE IF NOT EXISTS combined_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE UNIQUE,
  combined_score DECIMAL(5,1) NOT NULL CHECK (combined_score BETWEEN 40.0 AND 100.0),
  grade_code VARCHAR(1) NOT NULL,
  grade_name VARCHAR(20) NOT NULL,
  grade_emoji VARCHAR(10) NOT NULL,
  ai_count INT DEFAULT 0,                   -- 평가한 AI 개수 (Phase 1: 1, Phase 2: 5)
  last_updated TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_combined_score ON combined_final_scores(combined_score DESC);
CREATE INDEX idx_combined_grade ON combined_final_scores(grade_code);

-- ============================================================================
-- 2. 트리거 함수 정의
-- ============================================================================

-- 2.1 항목 점수 자동 계산 (Bayesian Prior 7.0 + 하한 클리핑)
CREATE OR REPLACE FUNCTION calculate_ai_item_score()
RETURNS TRIGGER AS $$
DECLARE
  v_ai_score DECIMAL(4,3);
  v_data_count INT;
  v_final_score DECIMAL(4,2);
  v_prior_score CONSTANT DECIMAL(3,1) := 7.0;  -- Bayesian Prior
  v_prior_weight CONSTANT INT := 10;           -- Prior Weight
BEGIN
  -- AI 평가 점수 및 데이터 개수 계산
  SELECT AVG(data_score), COUNT(*)
  INTO v_ai_score, v_data_count
  FROM collected_data
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num
    AND item_num = NEW.item_num;

  -- Bayesian Prior 7.0 적용
  v_final_score := (v_ai_score * v_data_count + v_prior_score * v_prior_weight)
                   / (v_data_count + v_prior_weight);

  -- ✅ 하한 클리핑: 4.0점 미만 방지 (±3점 범위 보장)
  IF v_final_score < 4.0 THEN
    v_final_score := 4.0;
  END IF;

  -- 항목 점수 저장
  INSERT INTO ai_item_scores (politician_id, ai_name, category_num, item_num, item_score, data_count)
  VALUES (NEW.politician_id, NEW.ai_name, NEW.category_num, NEW.item_num, v_final_score, v_data_count)
  ON CONFLICT (politician_id, ai_name, category_num, item_num)
  DO UPDATE SET
    item_score = v_final_score,
    data_count = v_data_count,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_calculate_ai_item_score ON collected_data;
CREATE TRIGGER trg_calculate_ai_item_score
AFTER INSERT OR UPDATE ON collected_data
FOR EACH ROW
EXECUTE FUNCTION calculate_ai_item_score();

-- ============================================================================
-- 2.2 분야 점수 자동 계산 (항목 점수 평균)
CREATE OR REPLACE FUNCTION calculate_ai_category_score()
RETURNS TRIGGER AS $$
BEGIN
  -- ai_item_scores INSERT/UPDATE 시 분야 점수 재계산
  INSERT INTO ai_category_scores (politician_id, ai_name, category_num, category_score, items_completed)
  SELECT
    NEW.politician_id,
    NEW.ai_name,
    NEW.category_num,
    AVG(item_score),  -- 항목 점수들의 평균 (이미 10점 만점)
    COUNT(*)
  FROM ai_item_scores
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num
  GROUP BY politician_id, ai_name, category_num
  ON CONFLICT (politician_id, ai_name, category_num)
  DO UPDATE SET
    category_score = EXCLUDED.category_score,
    items_completed = EXCLUDED.items_completed,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_calculate_ai_category_score ON ai_item_scores;
CREATE TRIGGER trg_calculate_ai_category_score
AFTER INSERT OR UPDATE ON ai_item_scores
FOR EACH ROW
EXECUTE FUNCTION calculate_ai_category_score();

-- ============================================================================
-- 2.3 AI별 최종 점수 자동 계산 (8단계 등급)
CREATE OR REPLACE FUNCTION calculate_ai_final_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score DECIMAL(5,1);
  v_grade_code VARCHAR(1);
  v_grade_name VARCHAR(20);
  v_grade_emoji VARCHAR(10);
  v_categories_completed INT;
  v_items_completed INT;
  v_data_count INT;
BEGIN
  -- ai_category_scores INSERT/UPDATE 시 최종 점수 재계산
  SELECT
    SUM(category_score),
    COUNT(*)
  INTO v_total_score, v_categories_completed
  FROM ai_category_scores
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name;

  -- 항목 완료 개수
  SELECT COUNT(*)
  INTO v_items_completed
  FROM ai_item_scores
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name;

  -- 총 데이터 개수
  SELECT COUNT(*)
  INTO v_data_count
  FROM collected_data
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name;

  -- 8단계 등급 계산
  IF v_total_score >= 93 THEN
    v_grade_code := 'M';
    v_grade_name := 'Mugunghwa';
    v_grade_emoji := '🌺';
  ELSIF v_total_score >= 86 THEN
    v_grade_code := 'D';
    v_grade_name := 'Diamond';
    v_grade_emoji := '💎';
  ELSIF v_total_score >= 79 THEN
    v_grade_code := 'E';
    v_grade_name := 'Emerald';
    v_grade_emoji := '💚';
  ELSIF v_total_score >= 72 THEN
    v_grade_code := 'P';
    v_grade_name := 'Platinum';
    v_grade_emoji := '🥇';
  ELSIF v_total_score >= 65 THEN
    v_grade_code := 'G';
    v_grade_name := 'Gold';
    v_grade_emoji := '🥇';
  ELSIF v_total_score >= 58 THEN
    v_grade_code := 'S';
    v_grade_name := 'Silver';
    v_grade_emoji := '🥈';
  ELSIF v_total_score >= 51 THEN
    v_grade_code := 'B';
    v_grade_name := 'Bronze';
    v_grade_emoji := '🥉';
  ELSIF v_total_score >= 44 THEN
    v_grade_code := 'I';
    v_grade_name := 'Iron';
    v_grade_emoji := '⚫';
  ELSE
    v_grade_code := 'F';
    v_grade_name := 'Fail';
    v_grade_emoji := '❌';
  END IF;

  -- AI별 최종 점수 저장
  INSERT INTO ai_final_scores (
    politician_id, ai_name, total_score, grade_code, grade_name, grade_emoji,
    categories_completed, items_completed, total_data_count
  )
  VALUES (
    NEW.politician_id, NEW.ai_name, v_total_score, v_grade_code, v_grade_name, v_grade_emoji,
    v_categories_completed, v_items_completed, v_data_count
  )
  ON CONFLICT (politician_id, ai_name)
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    grade_code = EXCLUDED.grade_code,
    grade_name = EXCLUDED.grade_name,
    grade_emoji = EXCLUDED.grade_emoji,
    categories_completed = EXCLUDED.categories_completed,
    items_completed = EXCLUDED.items_completed,
    total_data_count = EXCLUDED.total_data_count,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_calculate_ai_final_score ON ai_category_scores;
CREATE TRIGGER trg_calculate_ai_final_score
AFTER INSERT OR UPDATE ON ai_category_scores
FOR EACH ROW
EXECUTE FUNCTION calculate_ai_final_score();

-- ============================================================================
-- 2.4 종합 최종 점수 자동 계산 (5개 AI 평균)
CREATE OR REPLACE FUNCTION calculate_combined_final_score()
RETURNS TRIGGER AS $$
DECLARE
  v_combined_score DECIMAL(5,1);
  v_ai_count INT;
  v_grade_code VARCHAR(1);
  v_grade_name VARCHAR(20);
  v_grade_emoji VARCHAR(10);
BEGIN
  -- ai_final_scores INSERT/UPDATE 시 종합 점수 재계산
  SELECT
    AVG(total_score),
    COUNT(*)
  INTO v_combined_score, v_ai_count
  FROM ai_final_scores
  WHERE politician_id = NEW.politician_id;

  -- 8단계 등급 계산
  IF v_combined_score >= 93 THEN
    v_grade_code := 'M';
    v_grade_name := 'Mugunghwa';
    v_grade_emoji := '🌺';
  ELSIF v_combined_score >= 86 THEN
    v_grade_code := 'D';
    v_grade_name := 'Diamond';
    v_grade_emoji := '💎';
  ELSIF v_combined_score >= 79 THEN
    v_grade_code := 'E';
    v_grade_name := 'Emerald';
    v_grade_emoji := '💚';
  ELSIF v_combined_score >= 72 THEN
    v_grade_code := 'P';
    v_grade_name := 'Platinum';
    v_grade_emoji := '🥇';
  ELSIF v_combined_score >= 65 THEN
    v_grade_code := 'G';
    v_grade_name := 'Gold';
    v_grade_emoji := '🥇';
  ELSIF v_combined_score >= 58 THEN
    v_grade_code := 'S';
    v_grade_name := 'Silver';
    v_grade_emoji := '🥈';
  ELSIF v_combined_score >= 51 THEN
    v_grade_code := 'B';
    v_grade_name := 'Bronze';
    v_grade_emoji := '🥉';
  ELSIF v_combined_score >= 44 THEN
    v_grade_code := 'I';
    v_grade_name := 'Iron';
    v_grade_emoji := '⚫';
  ELSE
    v_grade_code := 'F';
    v_grade_name := 'Fail';
    v_grade_emoji := '❌';
  END IF;

  -- 종합 최종 점수 저장
  INSERT INTO combined_final_scores (
    politician_id, combined_score, grade_code, grade_name, grade_emoji, ai_count
  )
  VALUES (
    NEW.politician_id, v_combined_score, v_grade_code, v_grade_name, v_grade_emoji, v_ai_count
  )
  ON CONFLICT (politician_id)
  DO UPDATE SET
    combined_score = EXCLUDED.combined_score,
    grade_code = EXCLUDED.grade_code,
    grade_name = EXCLUDED.grade_name,
    grade_emoji = EXCLUDED.grade_emoji,
    ai_count = EXCLUDED.ai_count,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_calculate_combined_final_score ON ai_final_scores;
CREATE TRIGGER trg_calculate_combined_final_score
AFTER INSERT OR UPDATE ON ai_final_scores
FOR EACH ROW
EXECUTE FUNCTION calculate_combined_final_score();

-- ============================================================================
-- 3. 뷰 (View) - 실시간 조회
-- ============================================================================

-- 3.1 종합 최종 순위 (8단계 등급)
CREATE OR REPLACE VIEW v_combined_rankings AS
SELECT
  p.id,
  p.name,
  p.job_type,
  p.party,
  p.region,
  c.combined_score,
  c.grade_code,
  c.grade_name,
  c.grade_emoji,
  CONCAT(c.grade_emoji, ' ', c.grade_name, ' (', c.grade_code, ')') as grade_display,
  c.ai_count,
  RANK() OVER (ORDER BY c.combined_score DESC) as rank,
  RANK() OVER (PARTITION BY p.job_type ORDER BY c.combined_score DESC) as rank_by_job_type,
  CASE
    WHEN c.combined_score >= 65 THEN '합격'
    ELSE '불합격'
  END as pass_status
FROM politicians p
JOIN combined_final_scores c ON p.id = c.politician_id
ORDER BY c.combined_score DESC;

-- 3.2 AI별 최종 점수 상세
CREATE OR REPLACE VIEW v_ai_scores_detail AS
SELECT
  p.id,
  p.name,
  p.job_type,
  a.ai_name,
  a.total_score,
  a.grade_code,
  a.grade_name,
  a.grade_emoji,
  a.categories_completed,
  a.items_completed,
  a.total_data_count,
  c.combined_score,
  c.ai_count
FROM politicians p
JOIN ai_final_scores a ON p.id = a.politician_id
JOIN combined_final_scores c ON p.id = c.politician_id
ORDER BY p.name, a.ai_name;

-- 3.3 분야별 상세 (AI별)
CREATE OR REPLACE VIEW v_ai_category_details AS
SELECT
  p.name,
  c.ai_name,
  c.category_num,
  c.category_score,
  c.items_completed,
  c.last_updated
FROM politicians p
JOIN ai_category_scores c ON p.id = c.politician_id
ORDER BY p.name, c.ai_name, c.category_num;

-- 3.4 항목별 상세 (AI별)
CREATE OR REPLACE VIEW v_ai_item_details AS
SELECT
  p.name,
  i.ai_name,
  i.category_num,
  i.item_num,
  i.item_score,
  i.data_count,
  i.last_updated
FROM politicians p
JOIN ai_item_scores i ON p.id = i.politician_id
ORDER BY p.name, i.ai_name, i.category_num, i.item_num;

-- 3.5 데이터 수집 현황
CREATE OR REPLACE VIEW v_data_collection_status AS
SELECT
  p.name,
  cd.ai_name,
  cd.category_num,
  cd.item_num,
  COUNT(*) as data_count,
  AVG(cd.data_score) as avg_score,
  AVG(cd.reliability) as avg_reliability,
  MAX(cd.collected_at) as last_collected
FROM politicians p
JOIN collected_data cd ON p.id = cd.politician_id
GROUP BY p.name, cd.ai_name, cd.category_num, cd.item_num
ORDER BY p.name, cd.ai_name, cd.category_num, cd.item_num;

-- ============================================================================
-- 4. 유틸리티 함수
-- ============================================================================

-- 4.1 특정 정치인의 전체 점수 재계산 (강제 재계산)
CREATE OR REPLACE FUNCTION recalculate_politician_scores(p_politician_id UUID)
RETURNS VOID AS $$
DECLARE
  r_data RECORD;
BEGIN
  -- 1단계: collected_data 기반으로 ai_item_scores 재계산
  FOR r_data IN
    SELECT DISTINCT politician_id, ai_name, category_num, item_num
    FROM collected_data
    WHERE politician_id = p_politician_id
  LOOP
    PERFORM calculate_ai_item_score() FROM collected_data
    WHERE politician_id = r_data.politician_id
      AND ai_name = r_data.ai_name
      AND category_num = r_data.category_num
      AND item_num = r_data.item_num
    LIMIT 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4.2 모든 정치인 점수 재계산
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS VOID AS $$
DECLARE
  r_politician RECORD;
BEGIN
  FOR r_politician IN SELECT id FROM politicians LOOP
    PERFORM recalculate_politician_scores(r_politician.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. 샘플 데이터 삽입 (테스트용)
-- ============================================================================

-- 샘플 정치인 3명 (이재명, 오세훈, 김동연)
INSERT INTO politicians (name, job_type, party, region, current_position)
VALUES
  ('이재명', '광역단체장', '더불어민주당', '경기도', '경기도지사'),
  ('오세훈', '광역단체장', '국민의힘', '서울특별시', '서울특별시장'),
  ('김동연', '광역단체장', '무소속', '경기도', '경기도지사')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 완료
-- ============================================================================

-- 스키마 설치 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PoliticianFinder AI Evaluation Engine V2.0';
  RAISE NOTICE 'Schema Installation Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created: 6';
  RAISE NOTICE '  - politicians';
  RAISE NOTICE '  - collected_data';
  RAISE NOTICE '  - ai_item_scores';
  RAISE NOTICE '  - ai_category_scores';
  RAISE NOTICE '  - ai_final_scores';
  RAISE NOTICE '  - combined_final_scores';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers Created: 4';
  RAISE NOTICE '  - calculate_ai_item_score';
  RAISE NOTICE '  - calculate_ai_category_score';
  RAISE NOTICE '  - calculate_ai_final_score';
  RAISE NOTICE '  - calculate_combined_final_score';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created: 5';
  RAISE NOTICE '  - v_combined_rankings';
  RAISE NOTICE '  - v_ai_scores_detail';
  RAISE NOTICE '  - v_ai_category_details';
  RAISE NOTICE '  - v_ai_item_details';
  RAISE NOTICE '  - v_data_collection_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to start data collection!';
  RAISE NOTICE '============================================';
END $$;
