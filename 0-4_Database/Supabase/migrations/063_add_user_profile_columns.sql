-- Task ID: Profile Update Fix
-- Migration: Add missing user profile columns
-- Description: Add preferred_district, nickname, profile_image_url columns to users table
-- Created: 2025-12-14

-- Add preferred_district column for National Assembly constituency selection
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_district TEXT;
COMMENT ON COLUMN users.preferred_district IS 'User preferred National Assembly constituency (format: 광역|선거구, e.g., 서울|강남구 갑)';

-- Add nickname column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
COMMENT ON COLUMN users.nickname IS 'User display nickname';

-- Add profile_image_url column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
COMMENT ON COLUMN users.profile_image_url IS 'User profile image URL';

-- Add activity_level column for member level
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'ML1';
COMMENT ON COLUMN users.activity_level IS 'User activity level (ML1-ML5)';

-- Create index for preferred_district for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_preferred_district ON users(preferred_district);
