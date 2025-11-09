-- P2D1: 정치인 스키마 (Politician Schema)
-- 정치인 기본 정보, 상세 정보, 정당, 지역구, 직책 테이블 생성

-- 1. 정당 테이블
CREATE TABLE IF NOT EXISTS political_parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  abbreviation VARCHAR(50),
  color_code VARCHAR(7),
  description TEXT,
  established_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 직책 테이블
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  abbreviation VARCHAR(50),
  level VARCHAR(20), -- 'national', 'metropolitan', 'local'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 지역구 테이블
CREATE TABLE IF NOT EXISTS constituencies (
  id SERIAL PRIMARY KEY,
  region VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  level VARCHAR(20), -- 'national', 'metropolitan', 'local'
  population INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region, district)
);

-- 4. 정치인 기본 테이블
CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_kana VARCHAR(100),
  name_english VARCHAR(100),
  birth_date DATE,
  gender VARCHAR(10),
  political_party_id INTEGER REFERENCES political_parties(id),
  position_id INTEGER REFERENCES positions(id),
  constituency_id INTEGER REFERENCES constituencies(id),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  twitter_handle VARCHAR(100),
  facebook_url VARCHAR(255),
  instagram_handle VARCHAR(100),
  profile_image_url VARCHAR(255),
  bio TEXT,
  verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 정치인 상세 정보 테이블
CREATE TABLE IF NOT EXISTS politician_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  education TEXT,
  career_history TEXT,
  achievements TEXT,
  controversies TEXT,
  donation_limit DECIMAL(15,2),
  campaign_headquarters VARCHAR(255),
  election_count INTEGER DEFAULT 0,
  election_wins INTEGER DEFAULT 0,
  election_votes_received INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 공약 테이블
CREATE TABLE IF NOT EXISTS promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  completion_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 투표 기록 테이블
CREATE TABLE IF NOT EXISTS voting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  bill_name VARCHAR(255) NOT NULL,
  bill_number VARCHAR(100),
  vote_date DATE NOT NULL,
  vote_type VARCHAR(20), -- 'yes', 'no', 'abstain'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 활동 기록 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  activity_type VARCHAR(100), -- 'bill_introduced', 'vote_cast', 'speech', 'report_submitted'
  description TEXT,
  date DATE NOT NULL,
  url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_politicians_party ON politicians(political_party_id);
CREATE INDEX idx_politicians_position ON politicians(position_id);
CREATE INDEX idx_politicians_constituency ON politicians(constituency_id);
CREATE INDEX idx_politicians_name ON politicians(name);
CREATE INDEX idx_politicians_verified ON politicians(verified_at);
CREATE INDEX idx_politicians_active ON politicians(is_active);

CREATE INDEX idx_politician_details_politician ON politician_details(politician_id);
CREATE INDEX idx_promises_politician ON promises(politician_id);
CREATE INDEX idx_promises_status ON promises(status);
CREATE INDEX idx_voting_records_politician ON voting_records(politician_id);
CREATE INDEX idx_voting_records_date ON voting_records(vote_date);
CREATE INDEX idx_activity_logs_politician ON activity_logs(politician_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(date);

-- Full-text search 인덱스
CREATE INDEX idx_politicians_name_search ON politicians USING GIN(to_tsvector('korean', name));

-- RLS (Row Level Security) 정책
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 공개 데이터는 모든 사용자가 읽을 수 있음
CREATE POLICY select_all_politicians ON politicians FOR SELECT USING (true);
CREATE POLICY select_all_politician_details ON politician_details FOR SELECT USING (true);
CREATE POLICY select_all_promises ON promises FOR SELECT USING (true);
CREATE POLICY select_all_voting_records ON voting_records FOR SELECT USING (true);
CREATE POLICY select_all_activity_logs ON activity_logs FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE는 인증된 관리자만
CREATE POLICY insert_politicians ON politicians FOR INSERT WITH CHECK (true);
CREATE POLICY update_politicians ON politicians FOR UPDATE USING (true);
CREATE POLICY delete_politicians ON politicians FOR DELETE USING (true);
