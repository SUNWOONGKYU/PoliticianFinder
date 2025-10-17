-- =================================================================
-- P4D1: Database Performance Index Optimization
-- =================================================================
-- Task ID: P4D1
-- Date: 2025-10-17
-- Purpose: Add optimized indexes to improve query performance
-- Target Tables: comments, ratings, likes, notifications, politicians
-- =================================================================

-- ===========================
-- 1. Comments Table Indexes
-- ===========================
-- Optimizes: GET /api/comments (politician_id filtering, sorting)

-- Politician + Status filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_comments_politician_status_created
ON comments(politician_id, status, created_at DESC)
WHERE status = 'active';

-- User's comment history lookup
CREATE INDEX IF NOT EXISTS idx_comments_user_created
ON comments(user_id, created_at DESC);

-- Parent comment replies (optimizes N+1 query prevention)
CREATE INDEX IF NOT EXISTS idx_comments_parent_active
ON comments(parent_id, created_at ASC)
WHERE parent_id IS NOT NULL AND status = 'active';

-- Popular comments sorting (like_count)
CREATE INDEX IF NOT EXISTS idx_comments_politician_likes
ON comments(politician_id, like_count DESC, created_at DESC)
WHERE status = 'active';

-- Comment depth filtering (prevents deep nesting lookups)
CREATE INDEX IF NOT EXISTS idx_comments_depth
ON comments(depth)
WHERE depth < 2;

COMMENT ON INDEX idx_comments_politician_status_created IS 'Optimizes comments list by politician with active status filter';
COMMENT ON INDEX idx_comments_user_created IS 'Optimizes user comment history queries';
COMMENT ON INDEX idx_comments_parent_active IS 'Optimizes reply loading for parent comments (N+1 prevention)';
COMMENT ON INDEX idx_comments_politician_likes IS 'Optimizes popular comments sorting by likes';
COMMENT ON INDEX idx_comments_depth IS 'Optimizes depth-based filtering for comment threads';

-- ===========================
-- 2. Ratings Table Indexes
-- ===========================
-- Optimizes: GET /api/ratings, POST /api/ratings (duplicate check)

-- User + Politician composite (enforces 1-person-1-rating, duplicate check)
CREATE INDEX IF NOT EXISTS idx_ratings_user_politician
ON ratings(user_id, politician_id);

-- Politician ratings with sorting options
CREATE INDEX IF NOT EXISTS idx_ratings_politician_sort
ON ratings(politician_id, created_at DESC, score DESC);

-- User's rating history
CREATE INDEX IF NOT EXISTS idx_ratings_user_history
ON ratings(user_id, created_at DESC);

-- Category filtering (when category filter is used)
CREATE INDEX IF NOT EXISTS idx_ratings_politician_category_score
ON ratings(politician_id, category, score DESC)
WHERE category IS NOT NULL;

-- Recent high ratings (for statistics)
CREATE INDEX IF NOT EXISTS idx_ratings_recent_high
ON ratings(score, created_at DESC)
WHERE score >= 4 AND created_at > NOW() - INTERVAL '30 days';

COMMENT ON INDEX idx_ratings_user_politician IS 'Optimizes duplicate rating check and user-politician rating lookup';
COMMENT ON INDEX idx_ratings_politician_sort IS 'Optimizes ratings list with multiple sort options';
COMMENT ON INDEX idx_ratings_user_history IS 'Optimizes user rating history queries';
COMMENT ON INDEX idx_ratings_politician_category_score IS 'Optimizes category-filtered rating queries';
COMMENT ON INDEX idx_ratings_recent_high IS 'Optimizes recent high-rating statistics';

-- ===========================
-- 3. Likes Table Indexes
-- ===========================
-- Optimizes: POST /api/likes (duplicate check), GET likes status

-- User + Target composite (duplicate check, most critical)
CREATE INDEX IF NOT EXISTS idx_likes_user_target_type
ON likes(user_id, target_type, target_id);

-- Target lookup for like counts (batch queries)
CREATE INDEX IF NOT EXISTS idx_likes_target_composite
ON likes(target_type, target_id, created_at DESC);

-- User's like activity history
CREATE INDEX IF NOT EXISTS idx_likes_user_activity
ON likes(user_id, created_at DESC);

-- Target type filtering
CREATE INDEX IF NOT EXISTS idx_likes_type_recent
ON likes(target_type, created_at DESC);

COMMENT ON INDEX idx_likes_user_target_type IS 'Optimizes duplicate like check and user like status queries';
COMMENT ON INDEX idx_likes_target_composite IS 'Optimizes batch like count queries by target';
COMMENT ON INDEX idx_likes_user_activity IS 'Optimizes user like history and activity tracking';
COMMENT ON INDEX idx_likes_type_recent IS 'Optimizes recent likes by type queries';

-- ===========================
-- 4. Notifications Table Indexes
-- ===========================
-- Optimizes: GET /api/notifications (user filtering, unread status)

-- User + Read status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON notifications(recipient_id, is_read, created_at DESC);

-- Unread notifications only (critical for notification badge)
CREATE INDEX IF NOT EXISTS idx_notifications_unread_priority
ON notifications(recipient_id, created_at DESC)
WHERE is_read = FALSE;

-- Type filtering with user
CREATE INDEX IF NOT EXISTS idx_notifications_user_type
ON notifications(recipient_id, type, created_at DESC);

-- Priority notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority
ON notifications(recipient_id, priority, created_at DESC)
WHERE is_read = FALSE AND priority IN ('high', 'urgent');

-- Sender lookup (for batch sender info queries)
CREATE INDEX IF NOT EXISTS idx_notifications_sender
ON notifications(sender_id)
WHERE sender_id IS NOT NULL;

-- Entity relationship lookup
CREATE INDEX IF NOT EXISTS idx_notifications_entity
ON notifications(entity_type, entity_id)
WHERE entity_type IS NOT NULL;

COMMENT ON INDEX idx_notifications_user_read_created IS 'Optimizes notification list with read/unread filtering';
COMMENT ON INDEX idx_notifications_unread_priority IS 'Optimizes unread notification count queries (for badge)';
COMMENT ON INDEX idx_notifications_user_type IS 'Optimizes notification type filtering';
COMMENT ON INDEX idx_notifications_user_priority IS 'Optimizes priority notification queries';
COMMENT ON INDEX idx_notifications_sender IS 'Optimizes batch sender profile lookups';
COMMENT ON INDEX idx_notifications_entity IS 'Optimizes entity relationship lookups';

-- ===========================
-- 5. Politicians Table Indexes
-- ===========================
-- Optimizes: GET /api/politicians/search (filtering by party, region)

-- Name search (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_politicians_name_trgm
ON politicians USING gin(name gin_trgm_ops);

-- Party filtering with sorting
CREATE INDEX IF NOT EXISTS idx_politicians_party_name
ON politicians(party, name);

-- Region filtering with sorting
CREATE INDEX IF NOT EXISTS idx_politicians_region_name
ON politicians(region, name);

-- Position filtering
CREATE INDEX IF NOT EXISTS idx_politicians_position
ON politicians(position)
WHERE position IS NOT NULL;

-- Rating-based sorting
CREATE INDEX IF NOT EXISTS idx_politicians_rating_desc
ON politicians(avg_rating DESC NULLS LAST, total_ratings DESC);

-- Multi-column search optimization
CREATE INDEX IF NOT EXISTS idx_politicians_party_region
ON politicians(party, region)
WHERE party IS NOT NULL AND region IS NOT NULL;

COMMENT ON INDEX idx_politicians_name_trgm IS 'Optimizes fuzzy name search using trigram similarity';
COMMENT ON INDEX idx_politicians_party_name IS 'Optimizes party filtering with name sorting';
COMMENT ON INDEX idx_politicians_region_name IS 'Optimizes region filtering with name sorting';
COMMENT ON INDEX idx_politicians_position IS 'Optimizes position filtering queries';
COMMENT ON INDEX idx_politicians_rating_desc IS 'Optimizes rating-based sorting';
COMMENT ON INDEX idx_politicians_party_region IS 'Optimizes combined party and region filtering';

-- ===========================
-- 6. Enable pg_trgm Extension
-- ===========================
-- Required for fuzzy text search on politician names

CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON EXTENSION pg_trgm IS 'Trigram similarity for fuzzy text search';

-- ===========================
-- 7. Index Statistics and Verification
-- ===========================

DO $$
DECLARE
  v_index_count INTEGER;
  v_table_name TEXT;
  v_index_name TEXT;
BEGIN
  -- Count new indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_comments_%'
    OR indexname LIKE 'idx_ratings_%'
    OR indexname LIKE 'idx_likes_%'
    OR indexname LIKE 'idx_notifications_%'
    OR indexname LIKE 'idx_politicians_%'
  );

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'P4D1: Performance Indexes Created Successfully';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total indexes created/verified: %', v_index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Index breakdown by table:';

  -- Comments indexes
  FOR v_index_name IN
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'comments'
    AND indexname LIKE 'idx_comments_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  comments: %', v_index_name;
  END LOOP;

  -- Ratings indexes
  FOR v_index_name IN
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'ratings'
    AND indexname LIKE 'idx_ratings_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  ratings: %', v_index_name;
  END LOOP;

  -- Likes indexes
  FOR v_index_name IN
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'likes'
    AND indexname LIKE 'idx_likes_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  likes: %', v_index_name;
  END LOOP;

  -- Notifications indexes
  FOR v_index_name IN
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'notifications'
    AND indexname LIKE 'idx_notifications_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  notifications: %', v_index_name;
  END LOOP;

  -- Politicians indexes
  FOR v_index_name IN
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'politicians'
    AND indexname LIKE 'idx_politicians_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  politicians: %', v_index_name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Performance Optimization Summary:';
  RAISE NOTICE '- Comments: Optimized for politician filtering, parent replies, sorting';
  RAISE NOTICE '- Ratings: Optimized for duplicate checks, sorting, category filtering';
  RAISE NOTICE '- Likes: Optimized for duplicate checks, batch queries, user activity';
  RAISE NOTICE '- Notifications: Optimized for unread counts, type filtering, priority';
  RAISE NOTICE '- Politicians: Optimized for fuzzy search, party/region filtering';
  RAISE NOTICE '==============================================';
END $$;

-- ===========================
-- 8. Performance Monitoring Query
-- ===========================

-- View to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_comments_%'
    OR indexname LIKE 'idx_ratings_%'
    OR indexname LIKE 'idx_likes_%'
    OR indexname LIKE 'idx_notifications_%'
    OR indexname LIKE 'idx_politicians_%'
  )
ORDER BY idx_scan DESC;

COMMENT ON VIEW index_usage_stats IS 'Monitor index usage statistics for performance optimization';

-- Grant access to view
GRANT SELECT ON index_usage_stats TO authenticated;

-- ===========================
-- 9. Maintenance Recommendations
-- ===========================

COMMENT ON SCHEMA public IS 'Performance indexes added on 2025-10-17.
Recommended maintenance:
1. Run ANALYZE on tables weekly to update statistics
2. Monitor index usage via index_usage_stats view
3. Consider REINDEX if fragmentation occurs
4. Review slow query logs for additional optimization opportunities';

-- ===========================
-- Completion Message
-- ===========================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'P4D1 COMPLETED: Database Performance Indexes Successfully Created';
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run ANALYZE to update query planner statistics:';
  RAISE NOTICE '   ANALYZE comments, ratings, likes, notifications, politicians;';
  RAISE NOTICE '';
  RAISE NOTICE '2. Monitor index usage with:';
  RAISE NOTICE '   SELECT * FROM index_usage_stats;';
  RAISE NOTICE '';
  RAISE NOTICE '3. Check query performance improvements in application logs';
  RAISE NOTICE '===================================================================';
END $$;
