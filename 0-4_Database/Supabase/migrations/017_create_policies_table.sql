-- Task ID: P2D1
-- Migration: Create policies table
-- Description: Service policies management with versioning (P4BA10)

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('terms', 'privacy', 'marketing', 'community')),
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  effective_date TIMESTAMPTZ NOT NULL,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_version ON policies(version DESC);
CREATE INDEX idx_policies_is_current ON policies(is_current);
CREATE INDEX idx_policies_effective_date ON policies(effective_date DESC);
CREATE INDEX idx_policies_created_at ON policies(created_at DESC);

-- Unique constraint for type + version
CREATE UNIQUE INDEX idx_policies_type_version ON policies(type, version);

-- Composite index for current policies
CREATE INDEX idx_policies_current ON policies(type, is_current) WHERE is_current = TRUE;

-- Comments for documentation
COMMENT ON TABLE policies IS 'Service policies with version management';
COMMENT ON COLUMN policies.type IS 'Policy type: terms, privacy, marketing, community';
COMMENT ON COLUMN policies.version IS 'Version number (increments on updates)';
COMMENT ON COLUMN policies.is_current IS 'Whether this is the current active version';
COMMENT ON COLUMN policies.effective_date IS 'Date when this version becomes effective';
