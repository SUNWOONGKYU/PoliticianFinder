-- Add status column to politicians table
-- status: '현직', '후보자', '예비후보자', '출마자', '전직' etc.

ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT '현직';

-- Update existing politicians based on is_active
UPDATE politicians
SET status = CASE
  WHEN is_active = true THEN '현직'
  WHEN is_active = false THEN '전직'
  ELSE '현직'
END
WHERE status IS NULL OR status = '현직';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_politicians_status ON politicians(status);

COMMENT ON COLUMN politicians.status IS 'Politician status: 현직, 후보자, 예비후보자, 출마자, 전직';
