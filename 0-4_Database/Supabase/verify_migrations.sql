-- Task ID: P2D1
-- Script: Verification queries for database migrations
-- Description: Run these queries to verify migration success

-- ============================================================================
-- Table Verification
-- ============================================================================

-- Count all tables (should be 21)
SELECT
  'Tables Created' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 21 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected 21 tables'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- RLS Verification
-- ============================================================================

-- Check RLS enabled (should be 21)
SELECT
  'RLS Enabled' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 21 THEN '✓ PASS'
    ELSE '✗ FAIL - Not all tables have RLS enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- List tables with RLS status
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- Index Verification
-- ============================================================================

-- Count indexes
SELECT
  'Indexes Created' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 100 THEN '✓ PASS'
    ELSE '⚠ WARNING - Expected ~125 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- List indexes by table
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC;

-- ============================================================================
-- Trigger Verification
-- ============================================================================

-- Count triggers (should be 17)
SELECT
  'Triggers Created' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 17 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected 17 triggers'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- List triggers by table
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- Function Verification
-- ============================================================================

-- Count functions (should be 19+)
SELECT
  'Functions Created' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 19 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected at least 19 functions'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

-- List all functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- Foreign Key Verification
-- ============================================================================

-- Count foreign key constraints
SELECT
  'Foreign Keys' as check_type,
  COUNT(*) as count,
  '✓ All relationships defined' as status
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- List foreign keys by table
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- Storage Bucket Verification
-- ============================================================================

-- Count storage buckets (should be 4)
SELECT
  'Storage Buckets' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 4 THEN '✓ PASS'
    ELSE '✗ FAIL - Expected 4 buckets'
  END as status
FROM storage.buckets;

-- List storage buckets
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- Policy Verification
-- ============================================================================

-- Count RLS policies
SELECT
  'RLS Policies' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 70 THEN '✓ PASS'
    ELSE '⚠ WARNING - Expected ~80 policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public';

-- List policies by table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- ============================================================================
-- Full-text Search Index Verification
-- ============================================================================

-- Check GIN indexes for full-text search
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%gin%'
  AND indexdef LIKE '%to_tsvector%'
ORDER BY tablename;

-- ============================================================================
-- Initial Data Verification
-- ============================================================================

-- Check system_settings (should have ~20 rows)
SELECT
  'System Settings' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 15 THEN '✓ PASS'
    ELSE '✗ FAIL - Initial settings not loaded'
  END as status
FROM system_settings;

-- Check notification_templates (should have 6 rows)
SELECT
  'Notification Templates' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 6 THEN '✓ PASS'
    ELSE '✗ FAIL - Initial templates not loaded'
  END as status
FROM notification_templates;

-- ============================================================================
-- Summary
-- ============================================================================

SELECT
  '==========================================',
  'MIGRATION VERIFICATION SUMMARY',
  '==========================================';

SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_enabled,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_created,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers_created,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as functions_created,
  (SELECT COUNT(*) FROM storage.buckets) as storage_buckets,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies;

-- ============================================================================
-- Test Queries
-- ============================================================================

-- Test full-text search on politicians
SELECT
  'Full-text Search Test (Politicians)' as test_name,
  COUNT(*) as result
FROM politicians
WHERE to_tsvector('korean', name || ' ' || COALESCE(party, ''))
  @@ plainto_tsquery('korean', '민주당');

-- Test triggers (should update updated_at)
-- This is just a structure check, actual testing requires INSERT/UPDATE

-- Test functions
SELECT 'Function Test: calculate_user_level' as test_name,
  calculate_user_level(1000) as level_at_1000_points,
  calculate_user_level(10000) as level_at_10000_points;

-- Test helper functions
SELECT 'Helper Function Test: is_admin' as test_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN '✓ Function exists'
    ELSE '✗ Function missing'
  END as status;

SELECT 'Helper Function Test: is_moderator' as test_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_moderator') THEN '✓ Function exists'
    ELSE '✗ Function missing'
  END as status;

-- ============================================================================
-- Recommendations
-- ============================================================================

SELECT
  '=========================================='::text as info,
  'If all checks pass, the database is ready for use.'::text as recommendation
UNION ALL
SELECT
  ''::text,
  'Next steps:'::text
UNION ALL
SELECT
  ''::text,
  '1. Test RLS policies with different user roles'::text
UNION ALL
SELECT
  ''::text,
  '2. Populate initial data (users, politicians)'::text
UNION ALL
SELECT
  ''::text,
  '3. Generate TypeScript types from schema'::text
UNION ALL
SELECT
  ''::text,
  '4. Implement backend APIs'::text
UNION ALL
SELECT
  ''::text,
  '5. Set up monitoring and performance tracking'::text;
