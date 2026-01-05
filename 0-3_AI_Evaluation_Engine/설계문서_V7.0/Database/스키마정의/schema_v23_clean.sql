-- V23.0 스키마 (깨끗한 버전)

-- 1. politicians_v23 테이블
CREATE TABLE IF NOT EXISTS politicians_v23 (
  id TEXT PRIMARY KEY,
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

-- 2. ai_category_scores_v23 테이블
CREATE TABLE IF NOT EXISTS ai_category_scores_v23 (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL,
  ai_name VARCHAR(50) NOT NULL DEFAULT 'V23_Claude',
  category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
  category_score DECIMAL(5,2) NOT NULL CHECK (category_score BETWEEN 20.00 AND 100.00),
  avg_rating DECIMAL(4,2),
  data_count INT DEFAULT 0,
  items_completed INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name, category_num)
);

CREATE INDEX IF NOT EXISTS idx_ai_category_v23_politician ON ai_category_scores_v23(politician_id);
CREATE INDEX IF NOT EXISTS idx_ai_category_v23_ai_name ON ai_category_scores_v23(ai_name);

-- 3. ai_final_scores_v23 테이블
CREATE TABLE IF NOT EXISTS ai_final_scores_v23 (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL,
  ai_name VARCHAR(50) NOT NULL DEFAULT 'V23_Claude',
  total_score DECIMAL(6,2) NOT NULL CHECK (total_score BETWEEN 200.00 AND 1000.00),
  grade_code VARCHAR(1) NOT NULL,
  grade_name VARCHAR(20) NOT NULL,
  grade_emoji VARCHAR(10) NOT NULL,
  categories_completed INT DEFAULT 0,
  items_completed INT DEFAULT 0,
  total_data_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(politician_id, ai_name)
);

CREATE INDEX IF NOT EXISTS idx_ai_final_v23_politician ON ai_final_scores_v23(politician_id);
CREATE INDEX IF NOT EXISTS idx_ai_final_v23_score ON ai_final_scores_v23(total_score DESC);

-- 4. evaluation_status 테이블
CREATE TABLE IF NOT EXISTS evaluation_status (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL,
  current_step VARCHAR(100),
  progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_status_politician ON evaluation_status(politician_id);

-- 5. 샘플 데이터
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
