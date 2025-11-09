/**
 * Task ID: P2D1
 * Migration: Create favorite_politicians Table
 * Created: 2025-11-07
 * Author: database-developer
 * Description: User's favorite politicians tracking
 */

-- ================================================
-- Create favorite_politicians table
-- ================================================

CREATE TABLE IF NOT EXISTS public.favorite_politicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    politician_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate favorites
    UNIQUE(user_id, politician_id)
);

-- Comments
COMMENT ON TABLE public.favorite_politicians IS 'User favorite politicians tracking';
COMMENT ON COLUMN public.favorite_politicians.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.favorite_politicians.politician_id IS 'Reference to politicians table';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_user_id
    ON public.favorite_politicians(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_politician_id
    ON public.favorite_politicians(politician_id);
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_created_at
    ON public.favorite_politicians(created_at DESC);

-- RLS Policies
ALTER TABLE public.favorite_politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_own_favorites
    ON public.favorite_politicians FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS insert_own_favorites
    ON public.favorite_politicians FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS delete_own_favorites
    ON public.favorite_politicians FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_favorite_politicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_favorite_politicians_updated_at
    BEFORE UPDATE ON public.favorite_politicians
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_politicians_updated_at();
