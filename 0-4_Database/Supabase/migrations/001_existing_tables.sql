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
