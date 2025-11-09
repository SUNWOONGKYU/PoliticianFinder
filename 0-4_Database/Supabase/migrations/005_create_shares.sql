/**
 * Task ID: P2D1
 * Migration: Create shares Table
 * Created: 2025-11-07
 * Author: database-developer
 * Description: Content sharing tracking
 */

-- ================================================
-- Create shares table
-- ================================================

CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User who shared
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Shared content
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'politician', 'comment')),
    content_id VARCHAR(100) NOT NULL,

    -- Share platform
    platform VARCHAR(50) NOT NULL, -- facebook, twitter, kakao, clipboard, etc.

    -- Metadata
    share_url TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.shares IS 'Content sharing tracking';
COMMENT ON COLUMN public.shares.content_type IS 'Type: post, politician, comment';
COMMENT ON COLUMN public.shares.platform IS 'Share platform: facebook, twitter, kakao, clipboard, etc.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shares_user_id
    ON public.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_content_type_id
    ON public.shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shares_platform
    ON public.shares(platform);
CREATE INDEX IF NOT EXISTS idx_shares_created_at
    ON public.shares(created_at DESC);

-- RLS Policies
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_all_shares
    ON public.shares FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS insert_shares
    ON public.shares FOR INSERT
    WITH CHECK (true);

-- Admin can view all shares for analytics
CREATE POLICY IF NOT EXISTS admin_view_all_shares
    ON public.shares FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
