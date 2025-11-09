-- P2D3: AI 평가 스키마 (AI Evaluations Schema)
-- AI 모델별 정치인 평가 점수 저장

-- 1. AI 평가 메인 테이블
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL, -- 'claude', 'chatgpt', 'gemini', 'grok', 'perplexity'
  overall_score DECIMAL(5,2) NOT NULL,
  evaluation_date DATE NOT NULL,
  expiry_date DATE,
  report_url VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(politician_id, ai_model, evaluation_date)
);

-- 2. 평가 기준별 점수 테이블
CREATE TABLE IF NOT EXISTS evaluation_criteria_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_evaluation_id UUID NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
  criterion_name VARCHAR(50) NOT NULL, -- integrity, expertise, communication, leadership, etc.
  score DECIMAL(5,2) NOT NULL,
  description TEXT,
  evidence TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 평가 캐시 테이블
CREATE TABLE IF NOT EXISTS evaluation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  combined_overall_score DECIMAL(5,2),
  last_updated TIMESTAMP,
  cache_expiry TIMESTAMP,
  model_scores JSONB, -- { "claude": 97, "chatgpt": 95, ... }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(politician_id)
);

-- 4. 평가 이력 테이블
CREATE TABLE IF NOT EXISTS evaluation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  ai_model VARCHAR(50) NOT NULL,
  score_change DECIMAL(5,2),
  old_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  change_reason TEXT,
  evaluation_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 평가 기준 정의 테이블
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  korean_name VARCHAR(100) NOT NULL,
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0,
  category VARCHAR(50), -- 'integrity', 'competence', 'communication', 'leadership'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 평가 기준 데이터 삽입
INSERT INTO evaluation_criteria (name, korean_name, description, weight, category) VALUES
  ('integrity', '청렴성', 'Transparency and honesty in political conduct', 1.0, 'integrity'),
  ('expertise', '전문성', 'Professional knowledge and competence', 1.0, 'competence'),
  ('communication', '소통능력', 'Ability to communicate with constituents', 0.9, 'communication'),
  ('leadership', '리더십', 'Leadership qualities and decision-making', 1.0, 'leadership'),
  ('responsibility', '책임감', 'Sense of responsibility towards constituents', 0.9, 'integrity'),
  ('transparency', '투명성', 'Transparency in decision-making', 1.0, 'integrity'),
  ('responsiveness', '대응성', 'Responsiveness to public issues', 0.9, 'communication'),
  ('vision', '비전', 'Clear vision for community development', 1.0, 'leadership'),
  ('public_interest', '공익추구', 'Focus on public interest', 1.0, 'integrity'),
  ('ethics', '윤리성', 'Ethical standards and conduct', 1.0, 'integrity')
ON CONFLICT DO NOTHING;

-- 인덱스 생성
CREATE INDEX idx_ai_evaluations_politician ON ai_evaluations(politician_id);
CREATE INDEX idx_ai_evaluations_model ON ai_evaluations(ai_model);
CREATE INDEX idx_ai_evaluations_date ON ai_evaluations(evaluation_date DESC);
CREATE INDEX idx_ai_evaluations_expiry ON ai_evaluations(expiry_date);

CREATE INDEX idx_evaluation_criteria_scores_eval ON evaluation_criteria_scores(ai_evaluation_id);
CREATE INDEX idx_evaluation_criteria_scores_criterion ON evaluation_criteria_scores(criterion_name);

CREATE INDEX idx_evaluation_cache_politician ON evaluation_cache(politician_id);
CREATE INDEX idx_evaluation_cache_expiry ON evaluation_cache(cache_expiry);

CREATE INDEX idx_evaluation_history_politician ON evaluation_history(politician_id);
CREATE INDEX idx_evaluation_history_model ON evaluation_history(ai_model);
CREATE INDEX idx_evaluation_history_date ON evaluation_history(evaluation_date DESC);

-- RLS (Row Level Security) 정책
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 평가 결과 조회 가능
CREATE POLICY select_all_evaluations ON ai_evaluations FOR SELECT USING (true);
CREATE POLICY select_all_criteria_scores ON evaluation_criteria_scores FOR SELECT USING (true);
CREATE POLICY select_all_cache ON evaluation_cache FOR SELECT USING (true);
CREATE POLICY select_all_history ON evaluation_history FOR SELECT USING (true);
CREATE POLICY select_all_criteria ON evaluation_criteria FOR SELECT USING (true);

-- INSERT/UPDATE는 인증된 관리자만
CREATE POLICY insert_evaluations ON ai_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY update_evaluations ON ai_evaluations FOR UPDATE USING (true);
