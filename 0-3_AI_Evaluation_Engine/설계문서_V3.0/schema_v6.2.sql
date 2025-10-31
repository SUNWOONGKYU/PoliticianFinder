-- ============================================================================
-- PoliticianFinder AI Evaluation Engine V6.2
-- Supabase Schema (PostgreSQL)
-- ============================================================================
-- 작성일: 2025-10-31
-- 버전: 6.2
-- 핵심 특징:
--   - Rating 기반 (-5 ~ +5 척도)
--   - Prior 7.0 적용 (가중치 없이 Rating 변환)
--   - 8단계 금속 등급 체계 (M/D/E/P/G/S/B/I)
--   - 5개 AI 독립 평가 + 종합 점수
--   - 실시간 자동 점수 계산 (트리거)
--   - 점수 범위: 400~1,000점
-- ============================================================================

-- ============================================================================
-- 1. 테이블 생성
-- ============================================================================

-- 1.1 정치인 기본 정보
CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL,  -- 국회의원, 광역단체장, 광역의원, 기초단체장, 기초의원, 교육감
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
-- 1.2 수집된 원본 데이터 (AI별 독립 수집) - V6.2 Rating 기반
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
  rating INT NOT NULL CHECK (rating BETWEEN -5 AND 5),  -- V6.2: -5(매우 나쁨) ~ +5(매우 좋음)
  reliability DECIMAL(3,2) CHECK (reliability BETWEEN 0.00 AND 1.00),
  collected_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_data_politician ON collected_data(politician_id);
CREATE INDEX idx_data_ai_name ON collected_data(ai_name);
CREATE INDEX idx_data_category_item ON collected_data(category_num, item_num);
CREATE INDEX idx_data_politician_ai ON collected_data(politician_id, ai_name);

-- ============================================================================
-- 1.3 AI별 항목 점수 (V6.2 공식: 7.0 + rating_avg × 0.6)
CREATE TABLE IF NOT EXISTS ai_item_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  item_num INT NOT NULL CHECK (item_num BETWEEN 1 AND 10),
  item_score DECIMAL(4,2) NOT NULL CHECK (item_score BETWEEN 4.00 AND 10.00),  -- 4.0~10.0 범위
  rating_avg DECIMAL(4,2),  -- 평균 rating (-5.0 ~ +5.0)
  data_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num, item_num)
);

-- 인덱스
CREATE INDEX idx_ai_item_politician ON ai_item_scores(politician_id);
CREATE INDEX idx_ai_item_ai_name ON ai_item_scores(ai_name);
CREATE INDEX idx_ai_item_category ON ai_item_scores(category_num);

-- ============================================================================
-- 1.4 AI별 분야 점수 (V6.2: 항목 평균 × 10)
CREATE TABLE IF NOT EXISTS ai_category_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  category_score DECIMAL(5,2) NOT NULL CHECK (category_score BETWEEN 40.00 AND 100.00),  -- 40~100 범위
  items_completed INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num)
);

-- 인덱스
CREATE INDEX idx_ai_category_politician ON ai_category_scores(politician_id);
CREATE INDEX idx_ai_category_ai_name ON ai_category_scores(ai_name);

-- ============================================================================
-- 1.5 AI별 최종 점수 (V6.2: 400~1,000점, 8단계 금속 등급)
CREATE TABLE IF NOT EXISTS ai_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_name VARCHAR(50) NOT NULL,
  total_score INT NOT NULL CHECK (total_score BETWEEN 400 AND 1000),  -- V6.2: 400~1,000점
  grade_code VARCHAR(1) NOT NULL,           -- M, D, E, P, G, S, B, I
  grade_name VARCHAR(20) NOT NULL,          -- Mugunghwa, Diamond, Emerald, etc.
  grade_emoji VARCHAR(10) NOT NULL,         -- 🌺, 💎, 💚, 🥇, 🥈, 🥉, ⚫, 🪨, ⬛
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
-- 1.6 종합 최종 점수 (5개 AI 평균, V6.2: 400~1,000점)
CREATE TABLE IF NOT EXISTS combined_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE UNIQUE,
  combined_score INT NOT NULL CHECK (combined_score BETWEEN 400 AND 1000),  -- V6.2: 400~1,000점
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
-- 2. 트리거 함수 정의 (V6.2)
-- ============================================================================

-- 2.1 항목 점수 자동 계산 (V6.2: Item_Score = 7.0 + rating_avg × 0.6)
CREATE OR REPLACE FUNCTION calculate_ai_item_score()
RETURNS TRIGGER AS $$
DECLARE
  v_rating_avg DECIMAL(4,2);
  v_data_count INT;
  v_item_score DECIMAL(4,2);
BEGIN
  -- Rating 평균 및 데이터 개수 계산
  SELECT AVG(rating::DECIMAL), COUNT(*)
  INTO v_rating_avg, v_data_count
  FROM collected_data
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num
    AND item_num = NEW.item_num;

  -- V6.2 공식: Item_Score = 7.0 + (rating_avg × 0.6)
  v_item_score := 7.0 + (v_rating_avg * 0.6);

  -- 범위 제한: 4.0~10.0
  IF v_item_score < 4.0 THEN
    v_item_score := 4.0;
  ELSIF v_item_score > 10.0 THEN
    v_item_score := 10.0;
  END IF;

  -- 항목 점수 저장
  INSERT INTO ai_item_scores (politician_id, ai_name, category_num, item_num, item_score, rating_avg, data_count)
  VALUES (NEW.politician_id, NEW.ai_name, NEW.category_num, NEW.item_num, v_item_score, v_rating_avg, v_data_count)
  ON CONFLICT (politician_id, ai_name, category_num, item_num)
  DO UPDATE SET
    item_score = v_item_score,
    rating_avg = v_rating_avg,
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
-- 2.2 분야 점수 자동 계산 (V6.2: Category_Score = 항목평균 × 10)
CREATE OR REPLACE FUNCTION calculate_ai_category_score()
RETURNS TRIGGER AS $$
DECLARE
  v_item_avg DECIMAL(4,2);
  v_category_score DECIMAL(5,2);
  v_items_count INT;
BEGIN
  -- 7개 항목 점수 평균 계산
  SELECT AVG(item_score), COUNT(*)
  INTO v_item_avg, v_items_count
  FROM ai_item_scores
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num;

  -- V6.2 공식: Category_Score = (7개 항목 평균) × 10
  v_category_score := v_item_avg * 10;

  -- 분야 점수 저장
  INSERT INTO ai_category_scores (politician_id, ai_name, category_num, category_score, items_completed)
  VALUES (NEW.politician_id, NEW.ai_name, NEW.category_num, v_category_score, v_items_count)
  ON CONFLICT (politician_id, ai_name, category_num)
  DO UPDATE SET
    category_score = v_category_score,
    items_completed = v_items_count,
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
-- 2.3 AI별 최종 점수 자동 계산 (V6.2: 8단계 금속 등급, 400~1,000점)
CREATE OR REPLACE FUNCTION calculate_ai_final_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score INT;
  v_grade_code VARCHAR(1);
  v_grade_name VARCHAR(20);
  v_grade_emoji VARCHAR(10);
  v_categories_completed INT;
  v_items_completed INT;
  v_data_count INT;
BEGIN
  -- 10개 분야 점수 합계 계산
  SELECT
    SUM(category_score)::INT,
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

  -- V6.2: 8단계 금속 등급 계산 (400~1,000점)
  IF v_total_score >= 925 THEN
    v_grade_code := 'M';
    v_grade_name := 'Mugunghwa';
    v_grade_emoji := '🌺';
  ELSIF v_total_score >= 850 THEN
    v_grade_code := 'D';
    v_grade_name := 'Diamond';
    v_grade_emoji := '💎';
  ELSIF v_total_score >= 775 THEN
    v_grade_code := 'E';
    v_grade_name := 'Emerald';
    v_grade_emoji := '💚';
  ELSIF v_total_score >= 700 THEN
    v_grade_code := 'P';
    v_grade_name := 'Platinum';
    v_grade_emoji := '🥇';
  ELSIF v_total_score >= 625 THEN
    v_grade_code := 'G';
    v_grade_name := 'Gold';
    v_grade_emoji := '🥇';
  ELSIF v_total_score >= 550 THEN
    v_grade_code := 'S';
    v_grade_name := 'Silver';
    v_grade_emoji := '🥈';
  ELSIF v_total_score >= 475 THEN
    v_grade_code := 'B';
    v_grade_name := 'Bronze';
    v_grade_emoji := '🥉';
  ELSE
    v_grade_code := 'I';
    v_grade_name := 'Iron';
    v_grade_emoji := '⚫';
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
-- 2.4 종합 최종 점수 자동 계산 (5개 AI 평균, V6.2: 8단계)
CREATE OR REPLACE FUNCTION calculate_combined_final_score()
RETURNS TRIGGER AS $$
DECLARE
  v_combined_score INT;
  v_ai_count INT;
  v_grade_code VARCHAR(1);
  v_grade_name VARCHAR(20);
  v_grade_emoji VARCHAR(10);
BEGIN
  -- ai_final_scores INSERT/UPDATE 시 종합 점수 재계산
  SELECT
    AVG(total_score)::INT,
    COUNT(*)
  INTO v_combined_score, v_ai_count
  FROM ai_final_scores
  WHERE politician_id = NEW.politician_id;

  -- V6.2: 8단계 금속 등급 계산
  IF v_combined_score >= 925 THEN
    v_grade_code := 'M';
    v_grade_name := 'Mugunghwa';
    v_grade_emoji := '🌺';
  ELSIF v_combined_score >= 850 THEN
    v_grade_code := 'D';
    v_grade_name := 'Diamond';
    v_grade_emoji := '💎';
  ELSIF v_combined_score >= 775 THEN
    v_grade_code := 'E';
    v_grade_name := 'Emerald';
    v_grade_emoji := '💚';
  ELSIF v_combined_score >= 700 THEN
    v_grade_code := 'P';
    v_grade_name := 'Platinum';
    v_grade_emoji := '🥇';
  ELSIF v_combined_score >= 625 THEN
    v_grade_code := 'G';
    v_grade_name := 'Gold';
    v_grade_emoji := '🥇';
  ELSIF v_combined_score >= 550 THEN
    v_grade_code := 'S';
    v_grade_name := 'Silver';
    v_grade_emoji := '🥈';
  ELSIF v_combined_score >= 475 THEN
    v_grade_code := 'B';
    v_grade_name := 'Bronze';
    v_grade_emoji := '🥉';
  ELSE
    v_grade_code := 'I';
    v_grade_name := 'Iron';
    v_grade_emoji := '⚫';
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

-- 3.1 종합 최종 순위 (V6.2: 10단계 금속 등급, 400~1,000점)
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
    WHEN c.combined_score >= 700 THEN '합격'  -- V6.2: G(Gold) 이상
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
  i.rating_avg,  -- V6.2: rating_avg 추가
  i.data_count,
  i.last_updated
FROM politicians p
JOIN ai_item_scores i ON p.id = i.politician_id
ORDER BY p.name, i.ai_name, i.category_num, i.item_num;

-- 3.5 데이터 수집 현황 (V6.2: rating 기반)
CREATE OR REPLACE VIEW v_data_collection_status AS
SELECT
  p.name,
  cd.ai_name,
  cd.category_num,
  cd.item_num,
  COUNT(*) as data_count,
  AVG(cd.rating) as avg_rating,  -- V6.2: rating 평균
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

-- 샘플 정치인 4명 (오세훈, 박주민, 나경원, 우상호)
INSERT INTO politicians (name, job_type, party, region, current_position)
VALUES
  ('오세훈', '광역단체장', '국민의힘', '서울특별시', '서울특별시장'),
  ('박주민', '국회의원', '더불어민주당', '서울 은평구', '국회의원'),
  ('나경원', '국회의원', '국민의힘', '서울 동작구', '전 국회의원'),
  ('우상호', '국회의원', '더불어민주당', '서울 서대문구', '국회의원')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 완료
-- ============================================================================

-- 스키마 설치 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PoliticianFinder AI Evaluation Engine V6.2';
  RAISE NOTICE 'Schema Installation Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created: 6';
  RAISE NOTICE '  - politicians';
  RAISE NOTICE '  - collected_data (rating: -5~+5)';
  RAISE NOTICE '  - ai_item_scores (4.0~10.0)';
  RAISE NOTICE '  - ai_category_scores (40~100)';
  RAISE NOTICE '  - ai_final_scores (400~1,000)';
  RAISE NOTICE '  - combined_final_scores (400~1,000)';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers Created: 4';
  RAISE NOTICE '  - calculate_ai_item_score (7.0 + rating_avg × 0.6)';
  RAISE NOTICE '  - calculate_ai_category_score (item_avg × 10)';
  RAISE NOTICE '  - calculate_ai_final_score (SUM 10 categories)';
  RAISE NOTICE '  - calculate_combined_final_score (AVG 5 AIs)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created: 5';
  RAISE NOTICE '  - v_combined_rankings';
  RAISE NOTICE '  - v_ai_scores_detail';
  RAISE NOTICE '  - v_ai_category_details';
  RAISE NOTICE '  - v_ai_item_details';
  RAISE NOTICE '  - v_data_collection_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Grade System: 8 levels (M/D/E/P/G/S/B/I)';
  RAISE NOTICE 'Score Range: 400~1,000 points';
  RAISE NOTICE 'Rating Scale: -5(매우 나쁨) ~ +5(매우 좋음)';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to start V6.2 data collection!';
  RAISE NOTICE '============================================';
END $$;
