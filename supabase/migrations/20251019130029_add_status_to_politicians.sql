-- Add 'status' column to politicians table
-- 정치인 신분: 현직, 후보자, 예비후보자, 출마자

-- Add status column with ENUM constraint
ALTER TABLE public.politicians
ADD COLUMN status TEXT DEFAULT '현직'
CHECK (status IN ('현직', '후보자', '예비후보자', '출마자'));

-- Add comment for documentation
COMMENT ON COLUMN public.politicians.status IS '정치인 신분: 현직, 후보자, 예비후보자, 출마자';

-- Create index for filtering by status
CREATE INDEX idx_politicians_status ON public.politicians(status);

-- Update existing records to have default status (현직)
UPDATE public.politicians SET status = '현직' WHERE status IS NULL;
