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
