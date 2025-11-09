-- Task ID: P2D1
-- Migration: Create advertisements table
-- Description: Advertisement management (P4BA9)

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('main', 'sidebar', 'post_top', 'post_bottom')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  target_audience JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- Indexes for performance
CREATE INDEX idx_advertisements_placement ON advertisements(placement);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX idx_advertisements_dates ON advertisements(start_date, end_date);
CREATE INDEX idx_advertisements_priority ON advertisements(priority DESC);
CREATE INDEX idx_advertisements_created_at ON advertisements(created_at DESC);

-- Composite index for active ads
CREATE INDEX idx_advertisements_active ON advertisements(placement, is_active, priority DESC)
  WHERE is_active = TRUE;

-- Comments for documentation
COMMENT ON TABLE advertisements IS 'Advertisement management and tracking';
COMMENT ON COLUMN advertisements.placement IS 'Ad placement: main, sidebar, post_top, post_bottom';
COMMENT ON COLUMN advertisements.impressions IS 'Number of times ad was displayed';
COMMENT ON COLUMN advertisements.clicks IS 'Number of times ad was clicked';
COMMENT ON COLUMN advertisements.priority IS 'Display priority (higher = shown first)';
COMMENT ON COLUMN advertisements.target_audience IS 'JSON targeting criteria (region, interests, etc.)';
