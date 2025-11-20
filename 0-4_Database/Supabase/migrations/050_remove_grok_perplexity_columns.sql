-- Migration: Remove Gemini and Perplexity columns from evaluation_snapshots
-- Description: Reducing AI evaluation models from 5 to 3 (Claude, ChatGPT, Grok only)
-- Reason: Keep Grok for X/Twitter data access, remove Gemini and Perplexity
-- Date: 2025-11-20

-- Remove gemini_score and perplexity_score columns from evaluation_snapshots table
ALTER TABLE evaluation_snapshots
  DROP COLUMN IF EXISTS gemini_score,
  DROP COLUMN IF EXISTS perplexity_score;

-- Update comment to reflect 3 AI models instead of 5
COMMENT ON COLUMN evaluation_snapshots.overall_score_avg IS 'Average overall score from 3 AI models (Claude, ChatGPT, Grok)';
