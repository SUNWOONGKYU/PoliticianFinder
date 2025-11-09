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
