-- Task ID: P2D1 (BUGFIX_004)
-- Migration: Create politician_details table
-- Description: Detailed information for politicians (education, career, achievements, etc.)

-- Politician Details table
CREATE TABLE IF NOT EXISTS politician_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  education TEXT,
  career_history TEXT,
  achievements TEXT,
  controversies TEXT,
  donation_limit TEXT,
  campaign_headquarters TEXT,
  election_count INTEGER DEFAULT 0,
  election_wins INTEGER DEFAULT 0,
  election_votes_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id)
);

-- Indexes for performance
CREATE INDEX idx_politician_details_politician_id ON politician_details(politician_id);
CREATE INDEX idx_politician_details_election_count ON politician_details(election_count DESC);
CREATE INDEX idx_politician_details_election_wins ON politician_details(election_wins DESC);

-- Comments for documentation
COMMENT ON TABLE politician_details IS 'Detailed information for politicians including education, career, and election history';
COMMENT ON COLUMN politician_details.politician_id IS 'Foreign key to politicians table (one-to-one relationship)';
COMMENT ON COLUMN politician_details.education IS 'Educational background in JSON or text format';
COMMENT ON COLUMN politician_details.career_history IS 'Career history in JSON or text format';
COMMENT ON COLUMN politician_details.achievements IS 'Major achievements and accomplishments';
COMMENT ON COLUMN politician_details.controversies IS 'Controversies and scandals';
COMMENT ON COLUMN politician_details.donation_limit IS 'Political donation limits or information';
COMMENT ON COLUMN politician_details.campaign_headquarters IS 'Campaign office address or information';
COMMENT ON COLUMN politician_details.election_count IS 'Total number of elections participated in';
COMMENT ON COLUMN politician_details.election_wins IS 'Number of elections won';
COMMENT ON COLUMN politician_details.election_votes_received IS 'Total votes received across all elections';
