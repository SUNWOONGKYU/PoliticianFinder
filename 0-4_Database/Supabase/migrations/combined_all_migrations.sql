-- Task ID: P2D1
-- Migration: Create users table
-- Description: User accounts and profiles

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  bio TEXT,
  location TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  banned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON COLUMN users.role IS 'User role: user, admin, moderator';
COMMENT ON COLUMN users.points IS 'Activity points earned by user';
COMMENT ON COLUMN users.level IS 'User level based on points';
COMMENT ON COLUMN users.is_banned IS 'Whether user is banned from the platform';
/**
 * Task ID: P2D1
 * Migration: Document Existing Tables
 * Created: 2025-11-07
 * Author: database-developer
 * Description: Documentation of existing tables in Supabase (no changes made)
 */

-- ================================================
-- EXISTING TABLES (Already Created)
-- ================================================

-- 1. profiles
--    - User profile information
--    - Columns: id, email, full_name, avatar_url, role, created_at, updated_at, nickname

-- 2. politicians
--    - Politician information
--    - Columns: id, name, party, region, position, profile_image_url, biography,
--               avg_rating, avatar_enabled, created_at, updated_at, composite_score,
--               position_type, status, gender, birth_year

-- 3. posts
--    - Community posts
--    - Columns: id, user_id, politician_id, category, title, content, view_count,
--               upvotes, downvotes, is_best, is_concept, created_at, updated_at,
--               hot_score, is_hot, trending_rank

-- 4. comments
--    - Post comments and replies
--    - Columns: id, post_id, user_id, content, parent_id, upvotes, downvotes,
--               created_at, updated_at

-- 5. notifications
--    - User notifications
--    - Already exists (structure to be documented)

-- 6. votes
--    - User votes on posts/comments
--    - Already exists (structure to be documented)

-- 7. reports
--    - Content reports
--    - Already exists (structure to be documented)

-- ================================================
-- NOTES
-- ================================================
-- Total existing tables: 7
-- Tables to be created: 14
-- Mock data exists for: politicians (30), posts (23), comments (59)
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
-- Task ID: P2D1
-- Migration: Create politicians table
-- Description: Politician profiles and information

-- Politicians table
CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  party TEXT NOT NULL,
  position TEXT NOT NULL,
  region TEXT,
  district TEXT,
  profile_image_url TEXT,
  birth_date DATE,
  education TEXT[],
  website_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  phone TEXT,
  email TEXT,
  office_address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  evaluation_score INTEGER DEFAULT 0,
  evaluation_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_politicians_name ON politicians(name);
CREATE INDEX idx_politicians_party ON politicians(party);
CREATE INDEX idx_politicians_position ON politicians(position);
CREATE INDEX idx_politicians_region ON politicians(region);
CREATE INDEX idx_politicians_district ON politicians(district);
CREATE INDEX idx_politicians_is_verified ON politicians(is_verified);
CREATE INDEX idx_politicians_evaluation_score ON politicians(evaluation_score DESC);
CREATE INDEX idx_politicians_view_count ON politicians(view_count DESC);
CREATE INDEX idx_politicians_favorite_count ON politicians(favorite_count DESC);
CREATE INDEX idx_politicians_created_at ON politicians(created_at DESC);

-- Full-text search index for Korean
CREATE INDEX idx_politicians_search ON politicians USING gin(
  to_tsvector('korean',
    name || ' ' ||
    COALESCE(name_en, '') || ' ' ||
    COALESCE(party, '') || ' ' ||
    COALESCE(region, '') || ' ' ||
    COALESCE(district, '')
  )
);

-- Comments for documentation
COMMENT ON TABLE politicians IS 'Politician profiles and information';
COMMENT ON COLUMN politicians.is_verified IS 'Whether politician has been verified by the owner';
COMMENT ON COLUMN politicians.evaluation_score IS 'AI-calculated evaluation score (0-100)';
COMMENT ON COLUMN politicians.evaluation_grade IS 'Letter grade based on evaluation score (A+, A, B+, etc.)';
-- Task ID: P2D1
-- Migration: Create careers table
-- Description: Politician career history

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_careers_politician_id ON careers(politician_id);
CREATE INDEX idx_careers_start_date ON careers(start_date DESC);
CREATE INDEX idx_careers_is_current ON careers(is_current);
CREATE INDEX idx_careers_order ON careers(politician_id, order_index);

-- Comments for documentation
COMMENT ON TABLE careers IS 'Politician career history and experience';
COMMENT ON COLUMN careers.is_current IS 'Whether this is the current position';
COMMENT ON COLUMN careers.order_index IS 'Display order for careers (lower = higher priority)';
/**
 * Task ID: P2D1
 * Migration: Create payments Table
 * Created: 2025-11-07
 * Author: database-developer
 * Description: Payment transactions tracking
 */

-- ================================================
-- Create payments table
-- ================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(50) NOT NULL, -- card, bank_transfer, mobile, etc.

    -- Transaction info
    transaction_id VARCHAR(200) UNIQUE,
    pg_provider VARCHAR(50), -- Payment Gateway: iamport, toss, etc.
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),

    -- Payment purpose
    purpose VARCHAR(100), -- premium_subscription, advertisement, donation, etc.
    description TEXT,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.payments IS 'Payment transactions';
COMMENT ON COLUMN public.payments.user_id IS 'User who made the payment';
COMMENT ON COLUMN public.payments.amount IS 'Payment amount (non-negative)';
COMMENT ON COLUMN public.payments.transaction_id IS 'Unique transaction ID from PG';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, completed, failed, cancelled, refunded';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status
    ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at
    ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id
    ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_purpose
    ON public.payments(purpose);

-- RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_own_payments
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS insert_own_payments
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin can view all payments
CREATE POLICY IF NOT EXISTS admin_view_all_payments
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();
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
-- Task ID: P2D1
-- Migration: Create pledges table
-- Description: Politician campaign pledges and promises

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'broken', 'postponed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  target_date DATE,
  completion_date DATE,
  evidence_url TEXT,
  verification_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pledges_politician_id ON pledges(politician_id);
CREATE INDEX idx_pledges_category ON pledges(category);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_target_date ON pledges(target_date);
CREATE INDEX idx_pledges_created_at ON pledges(created_at DESC);

-- Full-text search index
CREATE INDEX idx_pledges_search ON pledges USING gin(
  to_tsvector('korean', title || ' ' || description)
);

-- Comments for documentation
COMMENT ON TABLE pledges IS 'Politician campaign pledges and promises';
COMMENT ON COLUMN pledges.status IS 'Current status: pending, in_progress, completed, broken, postponed';
COMMENT ON COLUMN pledges.progress_percentage IS 'Progress percentage (0-100)';
COMMENT ON COLUMN pledges.verification_source IS 'Source of verification for pledge status';
-- Task ID: P2D1
-- Migration: Create posts table
-- Description: Community posts and discussions

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  politician_id TEXT REFERENCES politicians(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'question', 'debate', 'news')),
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_politician_id ON posts(politician_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- Full-text search index for Korean
CREATE INDEX idx_posts_search ON posts USING gin(
  to_tsvector('korean', title || ' ' || content)
);

-- Composite indexes for common queries
CREATE INDEX idx_posts_approved_created ON posts(moderation_status, created_at DESC) WHERE moderation_status = 'approved';
CREATE INDEX idx_posts_category_created ON posts(category, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE posts IS 'Community posts and discussions';
COMMENT ON COLUMN posts.category IS 'Post category: general, question, debate, news';
COMMENT ON COLUMN posts.is_pinned IS 'Whether post is pinned to top';
COMMENT ON COLUMN posts.is_locked IS 'Whether post is locked from new comments';
COMMENT ON COLUMN posts.moderation_status IS 'Moderation status: pending, approved, rejected, flagged';
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
-- Task ID: P2D1
-- Migration: Create comments table
-- Description: Comments on posts with nested replies support

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_comments_post_approved ON comments(post_id, moderation_status, created_at) WHERE moderation_status = 'approved';
CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_comments_search ON comments USING gin(
  to_tsvector('korean', content)
);

-- Comments for documentation
COMMENT ON TABLE comments IS 'Comments on posts with nested reply support';
COMMENT ON COLUMN comments.parent_comment_id IS 'Parent comment ID for nested replies (NULL for top-level comments)';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete flag (content hidden but structure preserved)';
COMMENT ON COLUMN comments.moderation_status IS 'Moderation status: pending, approved, rejected, flagged';
-- Task ID: P2D1
-- Migration: Create likes tables
-- Description: Post and comment likes tracking

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for post_likes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- Indexes for comment_likes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX idx_comment_likes_created_at ON comment_likes(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE post_likes IS 'Post likes tracking with unique constraint';
COMMENT ON TABLE comment_likes IS 'Comment likes tracking with unique constraint';
-- Task ID: P2D1
-- Migration: Create follows table
-- Description: User following relationships (user-to-user and user-to-politician)

-- Follows table for user-to-user relationships
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE follows IS 'User-to-user following relationships';
COMMENT ON COLUMN follows.follower_id IS 'User who is following';
COMMENT ON COLUMN follows.following_id IS 'User being followed';
-- Task ID: P2D1
-- Migration: Create notifications table
-- Description: User notifications for various activities

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like', 'follow', 'mention', 'reply', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT,
  target_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for various activities';
COMMENT ON COLUMN notifications.type IS 'Notification type: comment, like, follow, mention, reply, system';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification';
COMMENT ON COLUMN notifications.target_type IS 'Type of target object (post, comment, politician, etc.)';
COMMENT ON COLUMN notifications.target_id IS 'ID of target object';
-- Task ID: P2D1
-- Migration: Create user_favorites table
-- Description: User's favorite politicians tracking

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, politician_id)
);

-- Indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_politician_id ON user_favorites(politician_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE user_favorites IS 'User favorite politicians tracking';
-- Task ID: P2D1
-- Migration: Create ai_evaluations table
-- Description: AI-generated politician evaluations

-- AI evaluations table
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_grade TEXT,
  pledge_completion_rate INTEGER CHECK (pledge_completion_rate >= 0 AND pledge_completion_rate <= 100),
  activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
  controversy_score INTEGER CHECK (controversy_score >= 0 AND controversy_score <= 100),
  public_sentiment_score INTEGER CHECK (public_sentiment_score >= 0 AND public_sentiment_score <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  summary TEXT,
  detailed_analysis JSONB,
  sources TEXT[],
  ai_model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_evaluations_politician_id ON ai_evaluations(politician_id);
CREATE INDEX idx_ai_evaluations_date ON ai_evaluations(evaluation_date DESC);
CREATE INDEX idx_ai_evaluations_overall_score ON ai_evaluations(overall_score DESC);
CREATE INDEX idx_ai_evaluations_created_at ON ai_evaluations(created_at DESC);

-- Composite index for latest evaluation
CREATE INDEX idx_ai_evaluations_politician_latest ON ai_evaluations(politician_id, evaluation_date DESC);

-- Comments for documentation
COMMENT ON TABLE ai_evaluations IS 'AI-generated politician evaluations';
COMMENT ON COLUMN ai_evaluations.overall_score IS 'Overall evaluation score (0-100)';
COMMENT ON COLUMN ai_evaluations.overall_grade IS 'Letter grade (A+, A, B+, etc.)';
COMMENT ON COLUMN ai_evaluations.detailed_analysis IS 'Detailed JSON analysis with metrics';
COMMENT ON COLUMN ai_evaluations.sources IS 'URLs or references used for evaluation';
-- Task ID: P2D1
-- Migration: Create reports table
-- Description: User reports for inappropriate content

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'politician')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'resolved')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_target_type ON reports(target_type);
CREATE INDEX idx_reports_target_id ON reports(target_id);
CREATE INDEX idx_reports_reason ON reports(reason);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_reports_pending ON reports(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON reports(target_type, target_id, status);

-- Comments for documentation
COMMENT ON TABLE reports IS 'User reports for inappropriate content';
COMMENT ON COLUMN reports.target_type IS 'Type of reported content: post, comment, user, politician';
COMMENT ON COLUMN reports.reason IS 'Reason for report: spam, harassment, hate_speech, misinformation, inappropriate, other';
COMMENT ON COLUMN reports.status IS 'Report status: pending, reviewing, accepted, rejected, resolved';
-- Task ID: P2D1
-- Migration: Create shares table
-- Description: Social media shares tracking

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'politician', 'pledge')),
  target_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'kakao', 'link', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_target_type ON shares(target_type);
CREATE INDEX idx_shares_target_id ON shares(target_id);
CREATE INDEX idx_shares_platform ON shares(platform);
CREATE INDEX idx_shares_created_at ON shares(created_at DESC);

-- Composite index for analytics
CREATE INDEX idx_shares_target ON shares(target_type, target_id, platform);

-- Comments for documentation
COMMENT ON TABLE shares IS 'Social media shares tracking';
COMMENT ON COLUMN shares.target_type IS 'Type of shared content: post, politician, pledge';
COMMENT ON COLUMN shares.platform IS 'Share platform: facebook, twitter, kakao, link, other';
-- Task ID: P2D1
-- Migration: Create politician_verification table
-- Description: Politician identity verification records

-- Politician verification table
CREATE TABLE IF NOT EXISTS politician_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'document', 'phone', 'in_person', 'official_channel')),
  verification_token TEXT,
  token_expires_at TIMESTAMPTZ,
  submitted_documents TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_politician_verification_politician_id ON politician_verification(politician_id);
CREATE INDEX idx_politician_verification_user_id ON politician_verification(user_id);
CREATE INDEX idx_politician_verification_status ON politician_verification(status);
CREATE INDEX idx_politician_verification_created_at ON politician_verification(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE politician_verification IS 'Politician identity verification records';
COMMENT ON COLUMN politician_verification.verification_method IS 'Method of verification: email, document, phone, in_person, official_channel';
COMMENT ON COLUMN politician_verification.verification_token IS 'Unique token sent to politician for email verification';
COMMENT ON COLUMN politician_verification.submitted_documents IS 'URLs to uploaded verification documents';
-- Task ID: P2D1
-- Migration: Create audit_logs table
-- Description: Audit logs for admin actions (P4BA8)

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_admin_action ON audit_logs(admin_id, action_type, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (e.g., user_ban, post_delete, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with additional action details';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of admin when action was performed';
-- Task ID: P2D1
-- Migration: Create advertisements table
-- Description: Advertisement management (P4BA9)

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('main', 'sidebar', 'post_top', 'post_bottom')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  target_audience JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- Indexes for performance
CREATE INDEX idx_advertisements_placement ON advertisements(placement);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX idx_advertisements_dates ON advertisements(start_date, end_date);
CREATE INDEX idx_advertisements_priority ON advertisements(priority DESC);
CREATE INDEX idx_advertisements_created_at ON advertisements(created_at DESC);

-- Composite index for active ads
CREATE INDEX idx_advertisements_active ON advertisements(placement, is_active, priority DESC)
  WHERE is_active = TRUE;

-- Comments for documentation
COMMENT ON TABLE advertisements IS 'Advertisement management and tracking';
COMMENT ON COLUMN advertisements.placement IS 'Ad placement: main, sidebar, post_top, post_bottom';
COMMENT ON COLUMN advertisements.impressions IS 'Number of times ad was displayed';
COMMENT ON COLUMN advertisements.clicks IS 'Number of times ad was clicked';
COMMENT ON COLUMN advertisements.priority IS 'Display priority (higher = shown first)';
COMMENT ON COLUMN advertisements.target_audience IS 'JSON targeting criteria (region, interests, etc.)';
-- Task ID: P2D1
-- Migration: Create policies table
-- Description: Service policies management with versioning (P4BA10)

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('terms', 'privacy', 'marketing', 'community')),
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  effective_date TIMESTAMPTZ NOT NULL,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_version ON policies(version DESC);
CREATE INDEX idx_policies_is_current ON policies(is_current);
CREATE INDEX idx_policies_effective_date ON policies(effective_date DESC);
CREATE INDEX idx_policies_created_at ON policies(created_at DESC);

-- Unique constraint for type + version
CREATE UNIQUE INDEX idx_policies_type_version ON policies(type, version);

-- Composite index for current policies
CREATE INDEX idx_policies_current ON policies(type, is_current) WHERE is_current = TRUE;

-- Comments for documentation
COMMENT ON TABLE policies IS 'Service policies with version management';
COMMENT ON COLUMN policies.type IS 'Policy type: terms, privacy, marketing, community';
COMMENT ON COLUMN policies.version IS 'Version number (increments on updates)';
COMMENT ON COLUMN policies.is_current IS 'Whether this is the current active version';
COMMENT ON COLUMN policies.effective_date IS 'Date when this version becomes effective';
-- Task ID: P2D1
-- Migration: Create notification_templates table
-- Description: Notification templates management (P4BA11)

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN ('comment', 'like', 'follow', 'mention', 'reply', 'system')),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  variables TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_is_enabled ON notification_templates(is_enabled);

-- Insert default templates
INSERT INTO notification_templates (type, title_template, body_template, variables) VALUES
  ('comment', '{actor_name}님이 댓글을 남겼습니다', '{actor_name}님이 회원님의 게시글에 댓글을 남겼습니다: "{comment_content}"', ARRAY['actor_name', 'comment_content']),
  ('like', '{actor_name}님이 공감했습니다', '{actor_name}님이 회원님의 게시글을 공감했습니다.', ARRAY['actor_name']),
  ('follow', '{actor_name}님이 팔로우했습니다', '{actor_name}님이 회원님을 팔로우했습니다.', ARRAY['actor_name']),
  ('mention', '{actor_name}님이 회원님을 언급했습니다', '{actor_name}님이 게시글에서 회원님을 언급했습니다.', ARRAY['actor_name']),
  ('reply', '{actor_name}님이 답글을 남겼습니다', '{actor_name}님이 회원님의 댓글에 답글을 남겼습니다: "{reply_content}"', ARRAY['actor_name', 'reply_content']),
  ('system', '시스템 알림', '{message}', ARRAY['message'])
ON CONFLICT (type) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE notification_templates IS 'Notification message templates';
COMMENT ON COLUMN notification_templates.title_template IS 'Template for notification title (supports variables)';
COMMENT ON COLUMN notification_templates.body_template IS 'Template for notification body (supports variables)';
COMMENT ON COLUMN notification_templates.variables IS 'List of available template variables';
-- Task ID: P2D1
-- Migration: Create system_settings table
-- Description: Global system settings management (P4BA12)

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description, category) VALUES
  -- Point settings
  ('points.post', '10', 'Points awarded for creating a post', 'points'),
  ('points.comment', '5', 'Points awarded for writing a comment', 'points'),
  ('points.like', '1', 'Points awarded for liking content', 'points'),
  ('points.follow', '20', 'Points awarded for following a user', 'points'),
  ('points.daily_login', '5', 'Points awarded for daily login', 'points'),
  ('points.share', '3', 'Points awarded for sharing content', 'points'),

  -- Feature toggles
  ('features.community', 'true', 'Enable community features', 'features'),
  ('features.ai_evaluation', 'true', 'Enable AI evaluation features', 'features'),
  ('features.politician_verification', 'true', 'Enable politician verification', 'features'),
  ('features.notifications', 'true', 'Enable notifications system', 'features'),
  ('features.advertisements', 'true', 'Enable advertisements', 'features'),

  -- Maintenance
  ('maintenance.enabled', 'false', 'Maintenance mode enabled', 'maintenance'),
  ('maintenance.message', '"서비스 점검 중입니다. 잠시 후 다시 시도해주세요."', 'Maintenance mode message', 'maintenance'),
  ('maintenance.allowed_ips', '[]', 'IP addresses allowed during maintenance', 'maintenance'),

  -- Limits
  ('limits.post_length', '10000', 'Maximum post content length', 'limits'),
  ('limits.comment_length', '1000', 'Maximum comment content length', 'limits'),
  ('limits.upload_size_mb', '10', 'Maximum file upload size in MB', 'limits'),
  ('limits.daily_posts', '10', 'Maximum posts per day per user', 'limits'),
  ('limits.daily_comments', '50', 'Maximum comments per day per user', 'limits')
ON CONFLICT (key) DO NOTHING;

-- Index for performance
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- Comments for documentation
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN system_settings.key IS 'Setting key in dot notation (e.g., points.post)';
COMMENT ON COLUMN system_settings.value IS 'Setting value stored as JSON';
COMMENT ON COLUMN system_settings.category IS 'Setting category for organization';
-- Task ID: P2D1
-- Migration: Create admin_actions table
-- Description: Admin activity tracking and statistics (P4BA13)

-- Admin actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  result TEXT CHECK (result IN ('success', 'failure')),
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX idx_admin_actions_result ON admin_actions(result);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Composite indexes for analytics
CREATE INDEX idx_admin_actions_admin_type ON admin_actions(admin_id, action_type, created_at DESC);
CREATE INDEX idx_admin_actions_type_date ON admin_actions(action_type, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE admin_actions IS 'Admin activity tracking for statistics and monitoring';
COMMENT ON COLUMN admin_actions.action_type IS 'Type of admin action performed';
COMMENT ON COLUMN admin_actions.result IS 'Action result: success or failure';
COMMENT ON COLUMN admin_actions.duration_ms IS 'Time taken to complete action in milliseconds';
COMMENT ON COLUMN admin_actions.metadata IS 'Additional action metadata';
-- Task ID: P4BA19
-- Migration: Create evaluation_snapshots table
-- Description: Monthly snapshots of AI evaluations for time-series analysis

-- Evaluation snapshots table
CREATE TABLE IF NOT EXISTS evaluation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Overall scores (averaged from 5 AI models)
  overall_score_avg NUMERIC(5,2),
  overall_score_max INTEGER,
  overall_score_min INTEGER,

  -- AI model-specific scores
  claude_score INTEGER CHECK (claude_score >= 0 AND claude_score <= 100),
  chatgpt_score INTEGER CHECK (chatgpt_score >= 0 AND chatgpt_score <= 100),
  gemini_score INTEGER CHECK (gemini_score >= 0 AND gemini_score <= 100),
  grok_score INTEGER CHECK (grok_score >= 0 AND grok_score <= 100),
  perplexity_score INTEGER CHECK (perplexity_score >= 0 AND perplexity_score <= 100),

  -- 10 criteria averages
  integrity_avg NUMERIC(5,2),
  expertise_avg NUMERIC(5,2),
  communication_avg NUMERIC(5,2),
  leadership_avg NUMERIC(5,2),
  transparency_avg NUMERIC(5,2),
  responsiveness_avg NUMERIC(5,2),
  innovation_avg NUMERIC(5,2),
  collaboration_avg NUMERIC(5,2),
  constituency_service_avg NUMERIC(5,2),
  policy_impact_avg NUMERIC(5,2),

  -- Evaluation count
  evaluation_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evaluation_snapshots_politician_id ON evaluation_snapshots(politician_id);
CREATE INDEX idx_evaluation_snapshots_snapshot_date ON evaluation_snapshots(snapshot_date DESC);
CREATE INDEX idx_evaluation_snapshots_politician_date ON evaluation_snapshots(politician_id, snapshot_date DESC);

-- Unique constraint (one snapshot per politician per date)
CREATE UNIQUE INDEX idx_evaluation_snapshots_unique ON evaluation_snapshots(politician_id, snapshot_date);

-- RLS Policies
ALTER TABLE evaluation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluation snapshots are publicly readable"
  ON evaluation_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert evaluation snapshots"
  ON evaluation_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update evaluation snapshots"
  ON evaluation_snapshots FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE evaluation_snapshots IS 'Monthly snapshots of AI evaluations for time-series analysis';
COMMENT ON COLUMN evaluation_snapshots.overall_score_avg IS 'Average overall score from all AI models';
COMMENT ON COLUMN evaluation_snapshots.evaluation_count IS 'Number of evaluations included in this snapshot';
-- Task ID: P2D1
-- Migration: Create triggers
-- Description: Automatic timestamp updates and counter maintenance

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at for all tables
-- ============================================================================

-- Users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politicians
CREATE TRIGGER update_politicians_updated_at
  BEFORE UPDATE ON politicians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Careers
CREATE TRIGGER update_careers_updated_at
  BEFORE UPDATE ON careers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pledges
CREATE TRIGGER update_pledges_updated_at
  BEFORE UPDATE ON pledges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AI Evaluations
CREATE TRIGGER update_ai_evaluations_updated_at
  BEFORE UPDATE ON ai_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reports
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politician Verification
CREATE TRIGGER update_politician_verification_updated_at
  BEFORE UPDATE ON politician_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Advertisements
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification Templates
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update post like count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- ============================================================================
-- FUNCTION: Update comment like count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_like_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- ============================================================================
-- FUNCTION: Update post comment count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comment_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- ============================================================================
-- FUNCTION: Update comment reply count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_reply_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();

-- ============================================================================
-- FUNCTION: Update politician favorite count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_politician_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE politicians SET favorite_count = favorite_count + 1 WHERE id = NEW.politician_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE politicians SET favorite_count = favorite_count - 1 WHERE id = OLD.politician_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER politician_favorite_count_trigger
  AFTER INSERT OR DELETE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_politician_favorite_count();

-- ============================================================================
-- FUNCTION: Update share count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_share_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.target_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_count_trigger
  AFTER INSERT ON shares
  FOR EACH ROW
  EXECUTE FUNCTION update_share_count();

-- ============================================================================
-- FUNCTION: Increment politician view count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_politician_view_count(politician_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE politicians SET view_count = view_count + 1 WHERE id = politician_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Increment post view count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to current timestamp';
COMMENT ON FUNCTION update_post_like_count() IS 'Maintains accurate like_count on posts table';
COMMENT ON FUNCTION update_comment_like_count() IS 'Maintains accurate like_count on comments table';
COMMENT ON FUNCTION update_post_comment_count() IS 'Maintains accurate comment_count on posts table';
COMMENT ON FUNCTION update_comment_reply_count() IS 'Maintains accurate reply_count on comments table';
COMMENT ON FUNCTION update_politician_favorite_count() IS 'Maintains accurate favorite_count on politicians table';
COMMENT ON FUNCTION increment_politician_view_count(UUID) IS 'Safely increments politician view count';
COMMENT ON FUNCTION increment_post_view_count(UUID) IS 'Safely increments post view count';
-- Task ID: P2D1
-- Migration: Create database functions
-- Description: Utility functions for aggregations, rankings, and analytics

-- ============================================================================
-- FUNCTION: Get top politicians by score
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_politicians(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  party TEXT,
  position TEXT,
  region TEXT,
  evaluation_score INTEGER,
  evaluation_grade TEXT,
  view_count INTEGER,
  favorite_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.party,
    p.position,
    p.region,
    p.evaluation_score,
    p.evaluation_grade,
    p.view_count,
    p.favorite_count
  FROM politicians p
  ORDER BY p.evaluation_score DESC NULLS LAST, p.favorite_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Search politicians with full-text search
-- ============================================================================
CREATE OR REPLACE FUNCTION search_politicians(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  party TEXT,
  position TEXT,
  region TEXT,
  evaluation_score INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.party,
    p.position,
    p.region,
    p.evaluation_score,
    ts_rank(
      to_tsvector('korean', p.name || ' ' || COALESCE(p.party, '') || ' ' || COALESCE(p.region, '')),
      plainto_tsquery('korean', search_query)
    ) as rank
  FROM politicians p
  WHERE to_tsvector('korean', p.name || ' ' || COALESCE(p.party, '') || ' ' || COALESCE(p.region, ''))
    @@ plainto_tsquery('korean', search_query)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get user activity statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_posts INTEGER,
  total_comments INTEGER,
  total_likes_received INTEGER,
  total_followers INTEGER,
  total_following INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM posts WHERE user_id = user_uuid) as total_posts,
    (SELECT COUNT(*)::INTEGER FROM comments WHERE user_id = user_uuid) as total_comments,
    (SELECT (
      COALESCE((SELECT SUM(like_count)::INTEGER FROM posts WHERE user_id = user_uuid), 0) +
      COALESCE((SELECT SUM(like_count)::INTEGER FROM comments WHERE user_id = user_uuid), 0)
    )) as total_likes_received,
    (SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = user_uuid) as total_followers,
    (SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = user_uuid) as total_following;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get trending posts
-- ============================================================================
CREATE OR REPLACE FUNCTION get_trending_posts(
  hours_ago INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  user_id UUID,
  politician_id TEXT,
  category TEXT,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ,
  trend_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.user_id,
    p.politician_id,
    p.category,
    p.view_count,
    p.like_count,
    p.comment_count,
    p.created_at,
    (
      (p.like_count * 3) +
      (p.comment_count * 2) +
      (p.view_count * 0.1) +
      (p.share_count * 5)
    ) / EXTRACT(EPOCH FROM (NOW() - p.created_at) / 3600 + 2) as trend_score
  FROM posts p
  WHERE
    p.moderation_status = 'approved' AND
    p.created_at > NOW() - (hours_ago || ' hours')::INTERVAL
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate user level from points
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_user_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: sqrt(points / 100) + 1
  RETURN FLOOR(SQRT(points / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Award points to user
-- ============================================================================
CREATE OR REPLACE FUNCTION award_points(
  user_uuid UUID,
  points_to_add INTEGER,
  reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  new_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Update points
  UPDATE users
  SET points = points + points_to_add
  WHERE id = user_uuid
  RETURNING points INTO new_points;

  -- Calculate and update level
  new_level := calculate_user_level(new_points);
  UPDATE users
  SET level = new_level
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get politician pledge statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_politician_pledge_stats(politician_uuid UUID)
RETURNS TABLE (
  total_pledges INTEGER,
  completed_pledges INTEGER,
  in_progress_pledges INTEGER,
  broken_pledges INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_pledges,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_pledges,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_pledges,
    COUNT(*) FILTER (WHERE status = 'broken')::INTEGER as broken_pledges,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100), 2)
      ELSE 0
    END as completion_rate
  FROM pledges
  WHERE politician_id = politician_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get unread notification count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = user_uuid AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Mark all notifications as read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = user_uuid AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get admin action statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_action_stats(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  action_type TEXT,
  total_count BIGINT,
  success_count BIGINT,
  failure_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.action_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE result = 'success') as success_count,
    COUNT(*) FILTER (WHERE result = 'failure') as failure_count
  FROM admin_actions aa
  WHERE
    (start_date IS NULL OR aa.created_at >= start_date) AND
    (end_date IS NULL OR aa.created_at <= end_date)
  GROUP BY aa.action_type
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get active advertisements
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_ads(ad_placement TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  link_url TEXT,
  placement TEXT,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.image_url,
    a.link_url,
    a.placement,
    a.priority
  FROM advertisements a
  WHERE
    a.placement = ad_placement AND
    a.is_active = TRUE AND
    a.start_date <= NOW() AND
    a.end_date >= NOW()
  ORDER BY a.priority DESC, RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION get_top_politicians(INTEGER, INTEGER) IS 'Get top-ranked politicians by evaluation score';
COMMENT ON FUNCTION search_politicians(TEXT, INTEGER) IS 'Full-text search for politicians with ranking';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Get comprehensive user activity statistics';
COMMENT ON FUNCTION get_trending_posts(INTEGER, INTEGER) IS 'Get trending posts with calculated trend score';
COMMENT ON FUNCTION calculate_user_level(INTEGER) IS 'Calculate user level from points';
COMMENT ON FUNCTION award_points(UUID, INTEGER, TEXT) IS 'Award points to user and update level';
COMMENT ON FUNCTION get_politician_pledge_stats(UUID) IS 'Get politician pledge fulfillment statistics';
COMMENT ON FUNCTION get_unread_notification_count(UUID) IS 'Get count of unread notifications for user';
COMMENT ON FUNCTION mark_all_notifications_read(UUID) IS 'Mark all notifications as read for user';
COMMENT ON FUNCTION get_admin_action_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get admin action statistics by type';
COMMENT ON FUNCTION get_active_ads(TEXT) IS 'Get active advertisement for specified placement';
-- Task ID: P2D1
-- Migration: Create storage buckets
-- Description: Storage buckets for avatars, attachments, and politician images

-- Note: This migration uses Supabase storage functions
-- Make sure storage is enabled in your Supabase project

-- ============================================================================
-- Storage Buckets
-- ============================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Create attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

-- Create politician-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'politician-images',
  'politician-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Create advertisement-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisement-images',
  'advertisement-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- ============================================================================
-- Storage Policies - Avatars
-- ============================================================================

-- Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Storage Policies - Attachments
-- ============================================================================

-- Authenticated users can view their own attachments
CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can upload attachments
CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Storage Policies - Politician Images
-- ============================================================================

-- Anyone can view politician images
CREATE POLICY "Politician images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'politician-images');

-- Admins can upload politician images
CREATE POLICY "Admins can upload politician images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can update politician images
CREATE POLICY "Admins can update politician images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can delete politician images
CREATE POLICY "Admins can delete politician images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- Storage Policies - Advertisement Images
-- ============================================================================

-- Anyone can view advertisement images
CREATE POLICY "Advertisement images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertisement-images');

-- Admins can upload advertisement images
CREATE POLICY "Admins can upload advertisement images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update advertisement images
CREATE POLICY "Admins can update advertisement images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete advertisement images
CREATE POLICY "Admins can delete advertisement images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
-- Task ID: P2D1
-- Migration: Create RLS (Row Level Security) policies
-- Description: Comprehensive security policies for all tables

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies: Users
-- ============================================================================

-- Anyone can view non-banned users (public profiles)
CREATE POLICY "Anyone can view non-banned users"
  ON users FOR SELECT
  USING (is_banned = FALSE);

-- Users can view their own profile even if banned
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid()) -- Can't change own role
  );

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin());

-- Admins can update any user
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: Politicians
-- ============================================================================

-- Anyone can view politicians
CREATE POLICY "Anyone can view politicians"
  ON politicians FOR SELECT
  USING (true);

-- Admins and moderators can insert politicians
CREATE POLICY "Moderators can insert politicians"
  ON politicians FOR INSERT
  WITH CHECK (is_moderator());

-- Admins and moderators can update politicians
CREATE POLICY "Moderators can update politicians"
  ON politicians FOR UPDATE
  USING (is_moderator());

-- Only admins can delete politicians
CREATE POLICY "Admins can delete politicians"
  ON politicians FOR DELETE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: Careers
-- ============================================================================

-- Anyone can view careers
CREATE POLICY "Anyone can view careers"
  ON careers FOR SELECT
  USING (true);

-- Moderators can manage careers
CREATE POLICY "Moderators can insert careers"
  ON careers FOR INSERT
  WITH CHECK (is_moderator());

CREATE POLICY "Moderators can update careers"
  ON careers FOR UPDATE
  USING (is_moderator());

CREATE POLICY "Moderators can delete careers"
  ON careers FOR DELETE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Pledges
-- ============================================================================

-- Anyone can view pledges
CREATE POLICY "Anyone can view pledges"
  ON pledges FOR SELECT
  USING (true);

-- Moderators can manage pledges
CREATE POLICY "Moderators can insert pledges"
  ON pledges FOR INSERT
  WITH CHECK (is_moderator());

CREATE POLICY "Moderators can update pledges"
  ON pledges FOR UPDATE
  USING (is_moderator());

CREATE POLICY "Moderators can delete pledges"
  ON pledges FOR DELETE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Posts
-- ============================================================================

-- Anyone can view approved posts
CREATE POLICY "Anyone can view approved posts"
  ON posts FOR SELECT
  USING (moderation_status = 'approved');

-- Users can view their own posts
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Moderators can view all posts
CREATE POLICY "Moderators can view all posts"
  ON posts FOR SELECT
  USING (is_moderator());

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_banned = FALSE)
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Moderators can update any post (for moderation)
CREATE POLICY "Moderators can update posts"
  ON posts FOR UPDATE
  USING (is_moderator());

-- Moderators can delete any post
CREATE POLICY "Moderators can delete posts"
  ON posts FOR DELETE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Comments
-- ============================================================================

-- Anyone can view approved comments
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (moderation_status = 'approved' AND is_deleted = FALSE);

-- Users can view their own comments
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

-- Moderators can view all comments
CREATE POLICY "Moderators can view all comments"
  ON comments FOR SELECT
  USING (is_moderator());

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_banned = FALSE)
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Moderators can update any comment
CREATE POLICY "Moderators can update comments"
  ON comments FOR UPDATE
  USING (is_moderator());

-- Moderators can delete any comment
CREATE POLICY "Moderators can delete comments"
  ON comments FOR DELETE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Post Likes
-- ============================================================================

-- Anyone can view post likes
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Comment Likes
-- ============================================================================

-- Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Follows
-- ============================================================================

-- Anyone can view follows
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- RLS Policies: Notifications
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Will be controlled by service role

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: User Favorites
-- ============================================================================

-- Anyone can view favorites count
CREATE POLICY "Anyone can view favorites"
  ON user_favorites FOR SELECT
  USING (true);

-- Authenticated users can add favorites
CREATE POLICY "Authenticated users can add favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their favorites
CREATE POLICY "Users can remove favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: AI Evaluations
-- ============================================================================

-- Anyone can view AI evaluations
CREATE POLICY "Anyone can view ai evaluations"
  ON ai_evaluations FOR SELECT
  USING (true);

-- Only system/admin can create evaluations
CREATE POLICY "Admins can create evaluations"
  ON ai_evaluations FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update evaluations"
  ON ai_evaluations FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: Reports
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  USING (is_moderator());

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Moderators can update reports (resolve them)
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Shares
-- ============================================================================

-- Anyone can view share counts
CREATE POLICY "Anyone can view shares"
  ON shares FOR SELECT
  USING (true);

-- Authenticated users can create shares
CREATE POLICY "Authenticated users can share content"
  ON shares FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- RLS Policies: Politician Verification
-- ============================================================================

-- Moderators can view all verifications
CREATE POLICY "Moderators can view verifications"
  ON politician_verification FOR SELECT
  USING (is_moderator());

-- Users can view their own verification requests
CREATE POLICY "Users can view own verifications"
  ON politician_verification FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can request verification
CREATE POLICY "Users can request verification"
  ON politician_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Moderators can update verifications
CREATE POLICY "Moderators can update verifications"
  ON politician_verification FOR UPDATE
  USING (is_moderator());

-- ============================================================================
-- RLS Policies: Audit Logs
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Will be controlled by service role

-- ============================================================================
-- RLS Policies: Advertisements
-- ============================================================================

-- Anyone can view active advertisements
CREATE POLICY "Anyone can view active ads"
  ON advertisements FOR SELECT
  USING (is_active = TRUE);

-- Admins can view all advertisements
CREATE POLICY "Admins can view all ads"
  ON advertisements FOR SELECT
  USING (is_admin());

-- Admins can manage advertisements
CREATE POLICY "Admins can insert ads"
  ON advertisements FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update ads"
  ON advertisements FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete ads"
  ON advertisements FOR DELETE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: Policies
-- ============================================================================

-- Anyone can view current policies
CREATE POLICY "Anyone can view current policies"
  ON policies FOR SELECT
  USING (is_current = TRUE);

-- Admins can view all policy versions
CREATE POLICY "Admins can view all policies"
  ON policies FOR SELECT
  USING (is_admin());

-- Admins can manage policies
CREATE POLICY "Admins can insert policies"
  ON policies FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update policies"
  ON policies FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: Notification Templates
-- ============================================================================

-- Anyone can view enabled templates
CREATE POLICY "Anyone can view enabled templates"
  ON notification_templates FOR SELECT
  USING (is_enabled = TRUE);

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON notification_templates FOR SELECT
  USING (is_admin());

-- Admins can manage templates
CREATE POLICY "Admins can update templates"
  ON notification_templates FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- RLS Policies: System Settings
-- ============================================================================

-- Anyone can view public settings
CREATE POLICY "Anyone can view public settings"
  ON system_settings FOR SELECT
  USING (true);

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON system_settings FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can insert settings"
  ON system_settings FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================================
-- RLS Policies: Admin Actions
-- ============================================================================

-- Admins can view all admin actions
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (is_admin());

-- System can insert admin actions
CREATE POLICY "System can create admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (true); -- Will be controlled by service role

-- Comments
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION is_moderator() IS 'Helper function to check if current user is admin or moderator';
-- Task ID: P4O2
-- Migration: Create trending_posts_cache table
-- Description: Cache table for storing calculated trending post rankings

-- ============================================================================
-- TRENDING POSTS CACHE TABLE
-- ============================================================================
-- This table stores pre-calculated trending post rankings
-- Updated hourly by the /api/cron/aggregate-trending job

CREATE TABLE IF NOT EXISTS trending_posts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  trend_score NUMERIC NOT NULL,
  snapshot_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fast lookups by rank
CREATE INDEX idx_trending_cache_rank ON trending_posts_cache(rank ASC);

-- Index for finding most recent calculations
CREATE INDEX idx_trending_cache_calculated_at ON trending_posts_cache(calculated_at DESC);

-- Index for post lookups
CREATE INDEX idx_trending_cache_post_id ON trending_posts_cache(post_id);

-- Unique constraint to prevent duplicate entries per calculation
-- (A post should only appear once in the most recent calculation)
CREATE UNIQUE INDEX idx_trending_cache_post_unique ON trending_posts_cache(post_id, calculated_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trending_posts_cache IS 'Cache for pre-calculated trending post rankings (updated hourly)';
COMMENT ON COLUMN trending_posts_cache.post_id IS 'Foreign key to posts table';
COMMENT ON COLUMN trending_posts_cache.rank IS 'Ranking position (1-100)';
COMMENT ON COLUMN trending_posts_cache.trend_score IS 'Calculated trending score: (likes*3 + comments*5 + views*0.1) - (age_hours*2)';
COMMENT ON COLUMN trending_posts_cache.snapshot_data IS 'JSON snapshot of post data at calculation time';
COMMENT ON COLUMN trending_posts_cache.calculated_at IS 'When the trending score was calculated';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE trending_posts_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read trending posts cache (public data)
CREATE POLICY "Trending posts cache is publicly readable"
  ON trending_posts_cache
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete (cron job only)
-- In practice, this is handled by the service role key used by the cron job
-- No explicit policy needed as regular users shouldn't have write access

-- ============================================================================
-- HELPER FUNCTION: Get Latest Trending Posts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_trending_posts(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  rank INTEGER,
  trend_score NUMERIC,
  snapshot_data JSONB,
  calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_calculation AS (
    SELECT MAX(calculated_at) as max_calc
    FROM trending_posts_cache
  )
  SELECT
    tpc.post_id,
    tpc.rank,
    tpc.trend_score,
    tpc.snapshot_data,
    tpc.calculated_at
  FROM trending_posts_cache tpc
  CROSS JOIN latest_calculation lc
  WHERE tpc.calculated_at = lc.max_calc
  ORDER BY tpc.rank ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_trending_posts(INTEGER, INTEGER) IS 'Get the latest trending posts from cache with pagination';

-- ============================================================================
-- CLEANUP FUNCTION: Remove Old Cache Entries
-- ============================================================================
-- Keeps only the most recent 24 calculations (1 day of hourly data)

CREATE OR REPLACE FUNCTION cleanup_old_trending_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM trending_posts_cache
  WHERE calculated_at < (
    SELECT calculated_at
    FROM trending_posts_cache
    ORDER BY calculated_at DESC
    OFFSET 2400  -- Keep 24 hours * 100 posts = 2400 rows
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_trending_cache() IS 'Remove trending cache entries older than 24 hours';

-- ============================================================================
-- OPTIONAL: Automatic cleanup trigger (can be enabled if needed)
-- ============================================================================
-- This would automatically clean up old cache entries after new inserts
-- Commented out by default - cleanup can be done manually or via scheduled job

/*
CREATE OR REPLACE FUNCTION trigger_cleanup_trending_cache()
RETURNS trigger AS $$
BEGIN
  -- Only run cleanup if we have enough rows
  IF (SELECT COUNT(*) FROM trending_posts_cache) > 2500 THEN
    PERFORM cleanup_old_trending_cache();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_trending_cache
  AFTER INSERT ON trending_posts_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_trending_cache();
*/
-- Task ID: P4BA18
-- Migration: Update politician verification system
-- Description: Enhance verification system with email verification support

-- Note: politician_verification table already exists from migration 014
-- This migration adds missing features and updates schema

-- 1. Check if verification_token column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politician_verification'
    AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE politician_verification
    ADD COLUMN verification_token TEXT;
  END IF;
END $$;

-- 2. Check if token_expires_at column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politician_verification'
    AND column_name = 'token_expires_at'
  ) THEN
    ALTER TABLE politician_verification
    ADD COLUMN token_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Ensure politicians table has all verification columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN verified_by UUID REFERENCES users(id);
  END IF;
END $$;

-- 4. Add index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_politician_verification_token
ON politician_verification(verification_token);

-- 5. Add index on token_expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_politician_verification_expires
ON politician_verification(token_expires_at);

-- 6. Update RLS policies for politician_verification table
ALTER TABLE politician_verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verification requests" ON politician_verification;
DROP POLICY IF EXISTS "Users can create verification requests" ON politician_verification;

-- Create updated RLS policies
CREATE POLICY "Users can view their own verification requests"
  ON politician_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
  ON politician_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON politician_verification FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- 7. Add helpful comments
COMMENT ON COLUMN politician_verification.verification_token IS 'Email verification code (6-digit alphanumeric)';
COMMENT ON COLUMN politician_verification.token_expires_at IS 'Verification code expiration time (15 minutes from creation)';
COMMENT ON COLUMN politicians.is_verified IS 'Whether politician has been verified (identity confirmed)';
COMMENT ON COLUMN politicians.verified_at IS 'Timestamp when politician was verified';
COMMENT ON COLUMN politicians.verified_by IS 'User ID who verified the politician';

-- 8. Create function to clean up expired verification codes (optional, for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM politician_verification
  WHERE status = 'pending'
    AND token_expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_verification_codes() IS 'Cleanup expired verification codes older than 7 days';
/**
 * Task ID: P4BA16
 * Migration: Create download_history Table
 * Created: 2025-11-09
 * Author: backend-developer
 * Description: Track report download history with payment verification and limit enforcement
 */

-- ================================================
-- Create download_history table
-- ================================================

CREATE TABLE IF NOT EXISTS public.download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evaluation_id UUID NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,

    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.download_history IS 'Report download history for tracking and limit enforcement';
COMMENT ON COLUMN public.download_history.user_id IS 'User who downloaded the report';
COMMENT ON COLUMN public.download_history.evaluation_id IS 'AI evaluation report that was downloaded';
COMMENT ON COLUMN public.download_history.payment_id IS 'Payment transaction associated with the download';
COMMENT ON COLUMN public.download_history.ip_address IS 'IP address of the download request';
COMMENT ON COLUMN public.download_history.user_agent IS 'User agent string of the download request';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_download_history_user_id
    ON public.download_history(user_id);

CREATE INDEX IF NOT EXISTS idx_download_history_evaluation_id
    ON public.download_history(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_download_history_payment_id
    ON public.download_history(payment_id);

CREATE INDEX IF NOT EXISTS idx_download_history_created_at
    ON public.download_history(created_at DESC);

-- Composite index for download count queries
CREATE INDEX IF NOT EXISTS idx_download_history_user_eval
    ON public.download_history(user_id, evaluation_id);

-- RLS Policies
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY IF NOT EXISTS select_own_download_history
    ON public.download_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own download history (handled by API)
CREATE POLICY IF NOT EXISTS insert_own_download_history
    ON public.download_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin can view all download history
CREATE POLICY IF NOT EXISTS admin_view_all_download_history
    ON public.download_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ================================================
-- Optional: Add evaluator column to ai_evaluations if not exists
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ai_evaluations'
        AND column_name = 'evaluator'
    ) THEN
        ALTER TABLE public.ai_evaluations
        ADD COLUMN evaluator TEXT CHECK (evaluator IN ('claude', 'chatgpt', 'gemini', 'grok', 'perplexity'));

        COMMENT ON COLUMN public.ai_evaluations.evaluator IS 'AI model used for evaluation';

        CREATE INDEX IF NOT EXISTS idx_ai_evaluations_evaluator
            ON public.ai_evaluations(evaluator);
    END IF;
END $$;

-- ================================================
-- Optional: Add report_url column to ai_evaluations if not exists
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ai_evaluations'
        AND column_name = 'report_url'
    ) THEN
        ALTER TABLE public.ai_evaluations
        ADD COLUMN report_url TEXT;

        COMMENT ON COLUMN public.ai_evaluations.report_url IS 'URL to generated PDF report in Supabase Storage';
    END IF;
END $$;

-- ================================================
-- Optional: Update payments table for report purchases
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'pg_transaction_id'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN pg_transaction_id TEXT UNIQUE;

        COMMENT ON COLUMN public.payments.pg_transaction_id IS 'Payment Gateway transaction ID';

        CREATE INDEX IF NOT EXISTS idx_payments_pg_transaction_id
            ON public.payments(pg_transaction_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

        COMMENT ON COLUMN public.payments.paid_at IS 'Timestamp when payment was completed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

        COMMENT ON COLUMN public.payments.cancelled_at IS 'Timestamp when payment was cancelled';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'cancel_reason'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN cancel_reason TEXT;

        COMMENT ON COLUMN public.payments.cancel_reason IS 'Reason for payment cancellation';
    END IF;
END $$;
