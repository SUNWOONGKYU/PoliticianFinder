-- Rollback: Remove 'status' column from politicians table

-- Drop index
DROP INDEX IF EXISTS idx_politicians_status;

-- Drop column
ALTER TABLE public.politicians
DROP COLUMN IF EXISTS status;
