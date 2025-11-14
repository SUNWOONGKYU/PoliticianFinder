-- Add new columns to politicians table for detailed status tracking
-- This migration adds separate fields for identity and title

-- Add identity column (신분: 현직, 후보자, 예비후보자, 출마자)
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS identity VARCHAR(50);

-- Add title column (직책: 국회의원 (21대), 서울시의원 등)
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- Add gender column if not exists (성별)
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Update existing records to parse status field
-- For existing records, we'll keep the status field as is
-- New records will use identity + title separately

COMMENT ON COLUMN politicians.identity IS '신분 (현직, 후보자, 예비후보자, 출마자)';
COMMENT ON COLUMN politicians.title IS '직책 (국회의원 (21대), 서울시의원 등)';
COMMENT ON COLUMN politicians.status IS '신분/직책 (combined field for display, kept for backward compatibility)';
COMMENT ON COLUMN politicians.position IS '출마직종 (국회의원, 광역단체장, 광역의원, 기초단체장, 기초의원)';
COMMENT ON COLUMN politicians.gender IS '성별 (남, 여)';
