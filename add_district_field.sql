-- Add district field to politicians table
-- district: 기초 지역 (예: 강남구 갑, 서초구 을)
-- region: 광역 지역 (예: 서울, 부산)

-- Step 1: Add district column if not exists
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Step 2: Add column comment
COMMENT ON COLUMN politicians.district IS '기초 지역 (예: 강남구 갑, 서초구 을)';

-- Step 3: Verify
SELECT
  name,
  region AS "광역",
  district AS "기초",
  position AS "출마직종",
  party AS "정당"
FROM politicians
LIMIT 5;
