-- Task ID: P2D1
-- Migration: Create politicians table
-- Description: Politician profiles and information

-- Politicians table
CREATE TABLE IF NOT EXISTS politicians (
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
  verified_by UUID REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  evaluation_score INTEGER DEFAULT 0,
  evaluation_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
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

-- Full-text search index for Korean
CREATE INDEX idx_politicians_search ON politicians USING gin(
  to_tsvector('korean',
    name || ' ' ||
    COALESCE(name_en, '') || ' ' ||
    COALESCE(party, '') || ' ' ||
    COALESCE(region, '') || ' ' ||
    COALESCE(district, '')
  )
);

-- Comments for documentation
COMMENT ON TABLE politicians IS 'Politician profiles and information';
COMMENT ON COLUMN politicians.is_verified IS 'Whether politician has been verified by the owner';
COMMENT ON COLUMN politicians.evaluation_score IS 'AI-calculated evaluation score (0-100)';
COMMENT ON COLUMN politicians.evaluation_grade IS 'Letter grade based on evaluation score (A+, A, B+, etc.)';
