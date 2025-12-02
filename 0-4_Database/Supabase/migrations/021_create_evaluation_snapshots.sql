-- Task ID: P4BA19
-- Migration: Create evaluation_snapshots table
-- Description: Monthly snapshots of AI evaluations for time-series analysis
-- IMPORTANT: politician_id is TEXT (8-char hex), NOT UUID

-- Evaluation snapshots table
CREATE TABLE IF NOT EXISTS evaluation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Overall scores (averaged from 5 AI models)
  overall_score_avg NUMERIC(5,2),
  overall_score_max INTEGER,
  overall_score_min INTEGER,

  -- AI model-specific scores
  claude_score INTEGER CHECK (claude_score >= 0 AND claude_score <= 100),
  chatgpt_score INTEGER CHECK (chatgpt_score >= 0 AND chatgpt_score <= 100),
  gemini_score INTEGER CHECK (gemini_score >= 0 AND gemini_score <= 100),
  grok_score INTEGER CHECK (grok_score >= 0 AND grok_score <= 100),
  perplexity_score INTEGER CHECK (perplexity_score >= 0 AND perplexity_score <= 100),

  -- 10 criteria averages
  integrity_avg NUMERIC(5,2),
  expertise_avg NUMERIC(5,2),
  communication_avg NUMERIC(5,2),
  leadership_avg NUMERIC(5,2),
  transparency_avg NUMERIC(5,2),
  responsiveness_avg NUMERIC(5,2),
  innovation_avg NUMERIC(5,2),
  collaboration_avg NUMERIC(5,2),
  constituency_service_avg NUMERIC(5,2),
  policy_impact_avg NUMERIC(5,2),

  -- Evaluation count
  evaluation_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evaluation_snapshots_politician_id ON evaluation_snapshots(politician_id);
CREATE INDEX idx_evaluation_snapshots_snapshot_date ON evaluation_snapshots(snapshot_date DESC);
CREATE INDEX idx_evaluation_snapshots_politician_date ON evaluation_snapshots(politician_id, snapshot_date DESC);

-- Unique constraint (one snapshot per politician per date)
CREATE UNIQUE INDEX idx_evaluation_snapshots_unique ON evaluation_snapshots(politician_id, snapshot_date);

-- RLS Policies
ALTER TABLE evaluation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluation snapshots are publicly readable"
  ON evaluation_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert evaluation snapshots"
  ON evaluation_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update evaluation snapshots"
  ON evaluation_snapshots FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE evaluation_snapshots IS 'Monthly snapshots of AI evaluations for time-series analysis';
COMMENT ON COLUMN evaluation_snapshots.overall_score_avg IS 'Average overall score from all AI models';
COMMENT ON COLUMN evaluation_snapshots.evaluation_count IS 'Number of evaluations included in this snapshot';
