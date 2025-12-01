-- Task ID: FIX_POLITICIAN_RATINGS_FK
-- Migration: Fix politician_ratings foreign key constraint
-- Created: 2025-11-30
-- Description: Change user_id FK from auth.users to public.users

-- ⚠️ CRITICAL FIX
-- Problem: politician_ratings.user_id references auth.users(id)
-- But we use public.users table with user_id column
-- Solution: Drop old FK and create new one referencing public.users(user_id)

-- Drop existing foreign key constraint
ALTER TABLE politician_ratings
DROP CONSTRAINT IF EXISTS politician_ratings_user_id_fkey;

-- Add new foreign key constraint to public.users(user_id)
ALTER TABLE politician_ratings
ADD CONSTRAINT politician_ratings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT politician_ratings_user_id_fkey ON politician_ratings
IS 'FK to public.users(user_id) instead of auth.users(id)';
