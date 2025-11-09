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
  politician_id UUID,
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
