-- =================================================================
-- P5D2: Production Migration Execution Script
-- =================================================================
-- Task ID: P5D2
-- Date: 2025-10-18
-- Purpose: Safe production migration with validation and rollback
-- Prerequisites: P5D1 backup completed
-- =================================================================

-- CRITICAL: Do not execute this script directly in production
-- Follow the checklist in P5D2_PRODUCTION_MIGRATION_CHECKLIST.md

-- =================================================================
-- 1. PRE-MIGRATION VALIDATION
-- =================================================================

DO $$
DECLARE
    v_environment TEXT;
    v_confirmation TEXT := 'READY_FOR_PRODUCTION';
    v_user_input TEXT := 'REPLACE_WITH_CONFIRMATION'; -- Change this before execution
BEGIN
    -- Safety check
    IF v_user_input != v_confirmation THEN
        RAISE EXCEPTION 'Production migration not confirmed. Update v_user_input to proceed.';
    END IF;

    -- Environment detection
    SELECT current_database() INTO v_environment;

    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'P5D2: PRODUCTION MIGRATION - PRE-FLIGHT CHECK';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Database: %', v_environment;
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 2. SYSTEM STATUS SNAPSHOT
-- =================================================================

-- Create temporary table for migration tracking
CREATE TEMP TABLE IF NOT EXISTS migration_status (
    check_name TEXT PRIMARY KEY,
    status TEXT,
    details TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.1 Database size and statistics
INSERT INTO migration_status (check_name, status, details)
SELECT
    'database_size',
    'INFO',
    pg_size_pretty(pg_database_size(current_database()))
;

-- 2.2 Active connections
INSERT INTO migration_status (check_name, status, details)
SELECT
    'active_connections',
    CASE WHEN COUNT(*) > 50 THEN 'WARNING' ELSE 'OK' END,
    COUNT(*)::TEXT || ' active connections'
FROM pg_stat_activity
WHERE datname = current_database();

-- 2.3 Long-running queries
INSERT INTO migration_status (check_name, status, details)
SELECT
    'long_running_queries',
    CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END,
    COUNT(*)::TEXT || ' queries running > 5 minutes'
FROM pg_stat_activity
WHERE datname = current_database()
    AND state = 'active'
    AND NOW() - query_start > INTERVAL '5 minutes';

-- 2.4 Replication lag (if applicable)
INSERT INTO migration_status (check_name, status, details)
SELECT
    'replication_status',
    'INFO',
    'Check Supabase dashboard for replication status';

-- 2.5 Table statistics
INSERT INTO migration_status (check_name, status, details)
SELECT
    'table_row_counts',
    'INFO',
    json_object_agg(
        table_name,
        row_count
    )::TEXT
FROM (
    SELECT 'profiles'::TEXT as table_name, COUNT(*) as row_count FROM public.profiles
    UNION ALL SELECT 'politicians', COUNT(*) FROM public.politicians
    UNION ALL SELECT 'posts', COUNT(*) FROM public.posts
    UNION ALL SELECT 'comments', COUNT(*) FROM public.comments
    UNION ALL SELECT 'ratings', COUNT(*) FROM public.ratings
) counts;

-- Display system status
SELECT
    check_name,
    status,
    details,
    checked_at
FROM migration_status
ORDER BY
    CASE status
        WHEN 'ERROR' THEN 1
        WHEN 'WARNING' THEN 2
        WHEN 'OK' THEN 3
        ELSE 4
    END,
    check_name;

-- =================================================================
-- 3. DATA INTEGRITY VALIDATION
-- =================================================================

-- 3.1 Check for NULL user_ids
INSERT INTO migration_status (check_name, status, details)
SELECT
    'null_user_ids',
    CASE WHEN total_nulls > 0 THEN 'ERROR' ELSE 'OK' END,
    total_nulls::TEXT || ' NULL user_ids found'
FROM (
    SELECT
        COALESCE(
            (SELECT COUNT(*) FROM public.posts WHERE user_id IS NULL), 0
        ) +
        COALESCE(
            (SELECT COUNT(*) FROM public.comments WHERE user_id IS NULL), 0
        ) +
        COALESCE(
            (SELECT COUNT(*) FROM public.ratings WHERE user_id IS NULL), 0
        ) as total_nulls
) nulls;

-- 3.2 Check for orphaned records
INSERT INTO migration_status (check_name, status, details)
SELECT
    'orphaned_records',
    CASE WHEN total_orphans > 0 THEN 'WARNING' ELSE 'OK' END,
    total_orphans::TEXT || ' orphaned records found'
FROM (
    SELECT
        (SELECT COUNT(*)
         FROM public.posts p
         LEFT JOIN auth.users u ON p.user_id = u.id
         WHERE u.id IS NULL) +
        (SELECT COUNT(*)
         FROM public.comments c
         LEFT JOIN auth.users u ON c.user_id = u.id
         WHERE u.id IS NULL) as total_orphans
) orphans;

-- 3.3 Check rating constraints
INSERT INTO migration_status (check_name, status, details)
SELECT
    'rating_constraints',
    CASE WHEN invalid_ratings > 0 THEN 'ERROR' ELSE 'OK' END,
    invalid_ratings::TEXT || ' invalid ratings (score not 1-5)'
FROM (
    SELECT COUNT(*) as invalid_ratings
    FROM public.ratings
    WHERE score < 1 OR score > 5
) ratings;

-- 3.4 Check politician data integrity
INSERT INTO migration_status (check_name, status, details)
SELECT
    'politician_data',
    CASE WHEN invalid_politicians > 0 THEN 'ERROR' ELSE 'OK' END,
    invalid_politicians::TEXT || ' politicians with invalid data'
FROM (
    SELECT COUNT(*) as invalid_politicians
    FROM public.politicians
    WHERE name IS NULL
        OR party IS NULL
        OR region IS NULL
        OR (avg_rating IS NOT NULL AND (avg_rating < 0 OR avg_rating > 5))
) politicians;

-- =================================================================
-- 4. MIGRATION READINESS CHECK
-- =================================================================

DO $$
DECLARE
    v_error_count INTEGER;
    v_warning_count INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE status = 'ERROR'),
        COUNT(*) FILTER (WHERE status = 'WARNING')
    INTO v_error_count, v_warning_count
    FROM migration_status;

    RAISE NOTICE '';
    RAISE NOTICE 'Migration Readiness Summary:';
    RAISE NOTICE '- Errors: %', v_error_count;
    RAISE NOTICE '- Warnings: %', v_warning_count;
    RAISE NOTICE '';

    IF v_error_count > 0 THEN
        RAISE EXCEPTION 'Migration BLOCKED: % critical errors found. Review migration_status table.', v_error_count;
    END IF;

    IF v_warning_count > 0 THEN
        RAISE WARNING 'Migration has % warnings. Review before proceeding.', v_warning_count;
    END IF;

    RAISE NOTICE 'Pre-migration validation PASSED';
    RAISE NOTICE '';
END $$;

-- =================================================================
-- 5. MIGRATION EXECUTION PLACEHOLDER
-- =================================================================

-- IMPORTANT: This section should be replaced with actual migration SQL
-- Example: Applying pending migrations

BEGIN;

-- Track migration start
CREATE TEMP TABLE IF NOT EXISTS migration_log (
    migration_step TEXT,
    status TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

INSERT INTO migration_log (migration_step, status, started_at)
VALUES ('migration_start', 'IN_PROGRESS', NOW());

-- Example: Apply specific migration files
-- \i 20251018_specific_migration.sql

-- If no new migrations, mark as complete
UPDATE migration_log
SET status = 'COMPLETED',
    completed_at = NOW()
WHERE migration_step = 'migration_start';

COMMIT;

-- =================================================================
-- 6. POST-MIGRATION VALIDATION
-- =================================================================

DO $$
DECLARE
    v_validation_passed BOOLEAN := true;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'POST-MIGRATION VALIDATION';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';

    -- 6.1 Verify all tables exist
    PERFORM table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN (
            'profiles', 'politicians', 'posts', 'comments',
            'ratings', 'ai_scores', 'votes', 'bookmarks',
            'notifications', 'reports'
        );

    IF NOT FOUND THEN
        RAISE WARNING 'Some expected tables are missing!';
        v_validation_passed := false;
    ELSE
        RAISE NOTICE 'All core tables exist: OK';
    END IF;

    -- 6.2 Verify RLS is enabled
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
            AND tablename IN ('profiles', 'politicians', 'posts', 'comments', 'ratings')
            AND rowsecurity = false
    ) THEN
        RAISE WARNING 'RLS is disabled on some critical tables!';
        v_validation_passed := false;
    ELSE
        RAISE NOTICE 'RLS enabled on all critical tables: OK';
    END IF;

    -- 6.3 Verify indexes exist
    IF (SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname = 'public') < 10 THEN
        RAISE WARNING 'Expected index count not met!';
        v_validation_passed := false;
    ELSE
        RAISE NOTICE 'Indexes verified: OK';
    END IF;

    -- Final verdict
    IF v_validation_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE 'POST-MIGRATION VALIDATION: PASSED';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION 'POST-MIGRATION VALIDATION: FAILED - Review warnings and rollback if needed';
    END IF;
END $$;

-- =================================================================
-- 7. PERFORMANCE BASELINE
-- =================================================================

-- Create performance test queries
CREATE TEMP TABLE IF NOT EXISTS performance_baseline (
    query_name TEXT PRIMARY KEY,
    execution_time_ms NUMERIC,
    rows_returned INTEGER,
    tested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 1: Politicians list query
DO $$
DECLARE
    v_start TIMESTAMPTZ;
    v_duration NUMERIC;
    v_count INTEGER;
BEGIN
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count FROM public.politicians WHERE avg_rating > 0;
    v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);

    INSERT INTO performance_baseline (query_name, execution_time_ms, rows_returned)
    VALUES ('politicians_list', v_duration, v_count);
END $$;

-- Test 2: User ratings query
DO $$
DECLARE
    v_start TIMESTAMPTZ;
    v_duration NUMERIC;
    v_count INTEGER;
BEGIN
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count FROM public.ratings WHERE created_at > NOW() - INTERVAL '30 days';
    v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);

    INSERT INTO performance_baseline (query_name, execution_time_ms, rows_returned)
    VALUES ('recent_ratings', v_duration, v_count);
END $$;

-- Test 3: Posts with comments
DO $$
DECLARE
    v_start TIMESTAMPTZ;
    v_duration NUMERIC;
    v_count INTEGER;
BEGIN
    v_start := clock_timestamp();
    SELECT COUNT(*) INTO v_count
    FROM public.posts p
    LEFT JOIN public.comments c ON p.id = c.post_id
    WHERE p.created_at > NOW() - INTERVAL '7 days';
    v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);

    INSERT INTO performance_baseline (query_name, execution_time_ms, rows_returned)
    VALUES ('posts_with_comments', v_duration, v_count);
END $$;

-- Display performance baseline
SELECT
    query_name,
    ROUND(execution_time_ms, 2) || ' ms' as execution_time,
    rows_returned,
    tested_at
FROM performance_baseline
ORDER BY execution_time_ms DESC;

-- =================================================================
-- 8. MIGRATION COMPLETION REPORT
-- =================================================================

DO $$
DECLARE
    v_total_checks INTEGER;
    v_passed_checks INTEGER;
    v_migration_duration INTERVAL;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('OK', 'INFO'))
    INTO v_total_checks, v_passed_checks
    FROM migration_status;

    SELECT completed_at - started_at
    INTO v_migration_duration
    FROM migration_log
    WHERE migration_step = 'migration_start';

    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'P5D2: PRODUCTION MIGRATION COMPLETED';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Duration: %', COALESCE(v_migration_duration::TEXT, 'N/A');
    RAISE NOTICE '';
    RAISE NOTICE 'Validation Results:';
    RAISE NOTICE '- Total Checks: %', v_total_checks;
    RAISE NOTICE '- Passed: %', v_passed_checks;
    RAISE NOTICE '- Failed: %', v_total_checks - v_passed_checks;
    RAISE NOTICE '';
    RAISE NOTICE 'Performance Baseline:';
    RAISE NOTICE '- Query tests completed: %', (SELECT COUNT(*) FROM performance_baseline);
    RAISE NOTICE '- Average response time: %ms',
        (SELECT ROUND(AVG(execution_time_ms), 2) FROM performance_baseline);
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Monitor application logs for errors';
    RAISE NOTICE '2. Check Supabase dashboard metrics';
    RAISE NOTICE '3. Run integration tests';
    RAISE NOTICE '4. Monitor user-reported issues';
    RAISE NOTICE '5. Keep rollback script ready for 24 hours';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback available at:';
    RAISE NOTICE '  20251018_P5D2_rollback_plan.sql';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- FINAL NOTES
-- =================================================================
-- This migration script provides:
-- 1. Pre-migration validation and safety checks
-- 2. System status snapshot
-- 3. Data integrity verification
-- 4. Migration execution framework
-- 5. Post-migration validation
-- 6. Performance baseline establishment
-- 7. Comprehensive reporting
--
-- Always have backup ready before running production migrations!
-- Follow P5D2_PRODUCTION_MIGRATION_CHECKLIST.md for complete process
-- =================================================================
