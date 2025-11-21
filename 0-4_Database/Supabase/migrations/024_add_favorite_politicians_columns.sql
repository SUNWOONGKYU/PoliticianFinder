-- Task ID: FAVORITE_POLITICIAN_SCHEMA_FIX
-- Migration: Add missing columns to favorite_politicians table
-- Created: 2025-11-21
-- Description: Add notes, notification_enabled, is_pinned columns to match API requirements

-- ⚠️ CRITICAL: politician_id Type Convention
-- politician_id must be TEXT type (8-character hexadecimal string)
-- Examples: 'cd8c0263', '17270f25', 'de49f056'

-- Add missing columns to favorite_politicians table
ALTER TABLE public.favorite_politicians
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Update politician_id type to TEXT (if it's not already)
-- This ensures consistency with politicians.id (TEXT type)
ALTER TABLE public.favorite_politicians
ALTER COLUMN politician_id TYPE TEXT;

-- Add Foreign Key constraint (now that types match)
ALTER TABLE public.favorite_politicians
DROP CONSTRAINT IF EXISTS fk_favorite_politicians_politician;

ALTER TABLE public.favorite_politicians
ADD CONSTRAINT fk_favorite_politicians_politician
FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE;

-- Add index for pinned favorites (performance optimization)
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_is_pinned
ON public.favorite_politicians(user_id, is_pinned) WHERE is_pinned = true;

-- Add index for notification enabled (performance optimization)
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_notification
ON public.favorite_politicians(user_id, notification_enabled) WHERE notification_enabled = true;

-- Comments for documentation
COMMENT ON COLUMN public.favorite_politicians.notes IS 'User notes about this politician';
COMMENT ON COLUMN public.favorite_politicians.notification_enabled IS 'Receive notifications about this politician';
COMMENT ON COLUMN public.favorite_politicians.is_pinned IS 'Pin to top of favorites list';
COMMENT ON COLUMN public.favorite_politicians.politician_id IS 'Politician ID (TEXT, 8-char hex)';
