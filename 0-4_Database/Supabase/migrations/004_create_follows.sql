/**
 * Task ID: P2D1
 * Migration: Create follows Table
 * Created: 2025-11-07
 * Author: database-developer
 * Description: User follow relationships (user-to-user and user-to-politician)
 */

-- ================================================
-- Create follows table
-- ================================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Follower (the user who follows)
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Following target (can be user or politician)
    following_type VARCHAR(20) NOT NULL CHECK (following_type IN ('user', 'politician')),
    following_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_politician_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT follows_target_check CHECK (
        (following_type = 'user' AND following_user_id IS NOT NULL AND following_politician_id IS NULL) OR
        (following_type = 'politician' AND following_politician_id IS NOT NULL AND following_user_id IS NULL)
    ),

    -- Prevent duplicate follows
    UNIQUE(follower_id, following_type, following_user_id, following_politician_id)
);

-- Comments
COMMENT ON TABLE public.follows IS 'User follow relationships';
COMMENT ON COLUMN public.follows.follower_id IS 'User who follows';
COMMENT ON COLUMN public.follows.following_type IS 'Type: user or politician';
COMMENT ON COLUMN public.follows.following_user_id IS 'Target user if following_type=user';
COMMENT ON COLUMN public.follows.following_politician_id IS 'Target politician if following_type=politician';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id
    ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_user_id
    ON public.follows(following_user_id)
    WHERE following_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_following_politician_id
    ON public.follows(following_politician_id)
    WHERE following_politician_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_created_at
    ON public.follows(created_at DESC);

-- RLS Policies
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_all_follows
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS insert_own_follows
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY IF NOT EXISTS delete_own_follows
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);
