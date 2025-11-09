-- Task ID: P2D1
-- Migration: Create ai_evaluations table
-- Description: AI-generated politician evaluations

-- AI evaluations table
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_grade TEXT,
  pledge_completion_rate INTEGER CHECK (pledge_completion_rate >= 0 AND pledge_completion_rate <= 100),
  activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
  controversy_score INTEGER CHECK (controversy_score >= 0 AND controversy_score <= 100),
  public_sentiment_score INTEGER CHECK (public_sentiment_score >= 0 AND public_sentiment_score <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  summary TEXT,
  detailed_analysis JSONB,
  sources TEXT[],
  ai_model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_evaluations_politician_id ON ai_evaluations(politician_id);
CREATE INDEX idx_ai_evaluations_date ON ai_evaluations(evaluation_date DESC);
CREATE INDEX idx_ai_evaluations_overall_score ON ai_evaluations(overall_score DESC);
CREATE INDEX idx_ai_evaluations_created_at ON ai_evaluations(created_at DESC);

-- Composite index for latest evaluation
CREATE INDEX idx_ai_evaluations_politician_latest ON ai_evaluations(politician_id, evaluation_date DESC);

-- Comments for documentation
COMMENT ON TABLE ai_evaluations IS 'AI-generated politician evaluations';
COMMENT ON COLUMN ai_evaluations.overall_score IS 'Overall evaluation score (0-100)';
COMMENT ON COLUMN ai_evaluations.overall_grade IS 'Letter grade (A+, A, B+, etc.)';
COMMENT ON COLUMN ai_evaluations.detailed_analysis IS 'Detailed JSON analysis with metrics';
COMMENT ON COLUMN ai_evaluations.sources IS 'URLs or references used for evaluation';
