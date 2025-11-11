DROP TABLE IF EXISTS politicians CASCADE;

CREATE TABLE politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  party TEXT NOT NULL,
  position TEXT NOT NULL,
  region TEXT,
  district TEXT,
  profile_image_url TEXT,
  birth_date DATE,
  education TEXT[],
  website_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  phone TEXT,
  email TEXT,
  office_address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  evaluation_score INTEGER DEFAULT 0,
  evaluation_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_politicians_name ON politicians(name);
CREATE INDEX idx_politicians_party ON politicians(party);
CREATE INDEX idx_politicians_position ON politicians(position);
CREATE INDEX idx_politicians_region ON politicians(region);
CREATE INDEX idx_politicians_district ON politicians(district);
CREATE INDEX idx_politicians_is_verified ON politicians(is_verified);
CREATE INDEX idx_politicians_evaluation_score ON politicians(evaluation_score DESC);
CREATE INDEX idx_politicians_view_count ON politicians(view_count DESC);
CREATE INDEX idx_politicians_favorite_count ON politicians(favorite_count DESC);
CREATE INDEX idx_politicians_created_at ON politicians(created_at DESC);

INSERT INTO politicians (name, party, position, region, district, birth_date, is_verified, view_count, favorite_count, evaluation_score, evaluation_grade)
VALUES
  ('김민수', '민주당', '국회의원', '서울', '강남구', '1975-03-15', TRUE, 1520, 342, 85, 'A'),
  ('이지혜', '국민의힘', '국회의원', '부산', '해운대구', '1978-07-22', TRUE, 1350, 298, 82, 'A-'),
  ('박준호', '정의당', '국회의원', '경기', '성남시 분당구', '1972-11-08', TRUE, 890, 156, 78, 'B+'),
  ('최서영', '민주당', '시장', '인천', NULL, '1969-05-30', TRUE, 2100, 487, 88, 'A+'),
  ('정태우', '국민의힘', '도지사', '경기', NULL, '1965-09-12', TRUE, 1890, 423, 80, 'B+'),
  ('강은미', '정의당', '국회의원', '서울', '마포구', '1980-02-18', TRUE, 1120, 234, 76, 'B'),
  ('윤성호', '민주당', '국회의원', '대전', '유성구', '1973-12-25', TRUE, 980, 189, 79, 'B+'),
  ('한지원', '국민의힘', '국회의원', '광주', '서구', '1977-06-14', TRUE, 1250, 267, 83, 'A-'),
  ('오현준', '무소속', '시장', '대구', NULL, '1968-04-07', TRUE, 1670, 356, 81, 'A-'),
  ('임소라', '민주당', '국회의원', '울산', '남구', '1982-08-19', TRUE, 1045, 198, 77, 'B+');

SELECT COUNT(*) as total_politicians FROM politicians;
SELECT id, name, party, position, region FROM politicians ORDER BY created_at DESC;
