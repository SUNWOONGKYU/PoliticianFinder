-- Task ID: P2D1
-- Migration: Create pledges table
-- Description: Politician campaign pledges and promises

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'broken', 'postponed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  target_date DATE,
  completion_date DATE,
  evidence_url TEXT,
  verification_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pledges_politician_id ON pledges(politician_id);
CREATE INDEX idx_pledges_category ON pledges(category);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_target_date ON pledges(target_date);
CREATE INDEX idx_pledges_created_at ON pledges(created_at DESC);

-- Full-text search index
CREATE INDEX idx_pledges_search ON pledges USING gin(
  to_tsvector('korean', title || ' ' || description)
);

-- Comments for documentation
COMMENT ON TABLE pledges IS 'Politician campaign pledges and promises';
COMMENT ON COLUMN pledges.status IS 'Current status: pending, in_progress, completed, broken, postponed';
COMMENT ON COLUMN pledges.progress_percentage IS 'Progress percentage (0-100)';
COMMENT ON COLUMN pledges.verification_source IS 'Source of verification for pledge status';
