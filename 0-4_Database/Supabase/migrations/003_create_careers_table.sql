-- Task ID: P2D1
-- Migration: Create careers table
-- Description: Politician career history

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_careers_politician_id ON careers(politician_id);
CREATE INDEX idx_careers_start_date ON careers(start_date DESC);
CREATE INDEX idx_careers_is_current ON careers(is_current);
CREATE INDEX idx_careers_order ON careers(politician_id, order_index);

-- Comments for documentation
COMMENT ON TABLE careers IS 'Politician career history and experience';
COMMENT ON COLUMN careers.is_current IS 'Whether this is the current position';
COMMENT ON COLUMN careers.order_index IS 'Display order for careers (lower = higher priority)';
