-- Task ID: P4BA15
-- Add report_url column to ai_evaluations table
-- This column stores the public URL of the generated PDF report

-- Migration: Add report_url column
ALTER TABLE ai_evaluations
ADD COLUMN IF NOT EXISTS report_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN ai_evaluations.report_url IS 'Public URL of the generated PDF evaluation report stored in Supabase Storage';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_report_url
ON ai_evaluations(report_url)
WHERE report_url IS NOT NULL;

-- Note: This migration should be run on the Supabase database
-- You can run this via Supabase Dashboard > SQL Editor
-- Or via Supabase CLI: supabase migration new add_report_url_to_ai_evaluations
