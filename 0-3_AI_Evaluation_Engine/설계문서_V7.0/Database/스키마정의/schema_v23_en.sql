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

CREATE TABLE IF NOT EXISTS evaluation_status (
  id SERIAL PRIMARY KEY,
  politician_id TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL,
  current_step VARCHAR(100),
  progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_status_politician ON evaluation_status(politician_id);

INSERT INTO politicians_v23 (id, name, job_type, party, region, current_position)
VALUES
  ('10001', 'OH_SEHOON_V23', 'Mayor', 'PPP', 'Seoul', 'Seoul Mayor'),
  ('10002', 'PARK_JOOMIN_V23', 'Congressman', 'DPK', 'Seoul Eunpyeong', 'Congressman'),
  ('10004', 'NA_KYUNGWON_V23', 'Congressman', 'PPP', 'Seoul Dongjak', 'Congressman')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  job_type = EXCLUDED.job_type,
  party = EXCLUDED.party,
  region = EXCLUDED.region,
  current_position = EXCLUDED.current_position,
  updated_at = NOW();
