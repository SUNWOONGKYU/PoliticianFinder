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

SELECT 'Politicians table recreated successfully' as status;
