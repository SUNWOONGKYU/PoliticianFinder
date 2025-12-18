-- Migration: Add '출마예정자' to status enum
-- Date: 2025-12-18
-- Description: Update status CHECK constraint and change '출마자' to '출마예정자'

-- 1. Drop existing constraint
ALTER TABLE politicians DROP CONSTRAINT IF EXISTS politicians_status_check;

-- 2. Add new constraint with '출마예정자' included
ALTER TABLE politicians ADD CONSTRAINT politicians_status_check
CHECK (status IN ('현직', '후보자', '예비후보자', '출마예정자', '출마자'));

-- 3. Update all '출마자' to '출마예정자'
UPDATE politicians SET status = '출마예정자' WHERE status = '출마자';
