-- =================================================================
-- P5D2: Production Migration Rollback Plan
-- =================================================================
-- Task ID: P5D2-ROLLBACK
-- Date: 2025-10-18
-- Purpose: Emergency rollback for production migration
-- Prerequisites: Pre-migration backup completed (P5D1)
-- =================================================================

-- CRITICAL: Only execute this script if migration failed
-- This script provides rollback procedures for P5D2 migration

-- =================================================================
-- 1. ROLLBACK DECISION CRITERIA
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'P5D2: ROLLBACK PLAN - DECISION CRITERIA';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Execute rollback if ANY of these conditions are met:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Data Integrity Issues:';
    RAISE NOTICE '   - Missing or corrupted user data';
    RAISE NOTICE '   - Broken foreign key relationships';
    RAISE NOTICE '   - NULL values in critical columns';
    RAISE NOTICE '';
    RAISE NOTICE '2. Performance Degradation:';
    RAISE NOTICE '   - Query response time increased > 200%%';
    RAISE NOTICE '   - Database CPU usage > 80%% sustained';
    RAISE NOTICE '   - Connection pool exhaustion';
    RAISE NOTICE '';
    RAISE NOTICE '3. Application Errors:';
    RAISE NOTICE '   - Authentication failures';
    RAISE NOTICE '   - RLS policy blocking legitimate access';
    RAISE NOTICE '   - Critical features non-functional';
    RAISE NOTICE '';
    RAISE NOTICE '4. Migration Validation Failures:';
    RAISE NOTICE '   - Post-migration checks failed';
    RAISE NOTICE '   - Expected tables/indexes missing';
    RAISE NOTICE '   - RLS policies not applied correctly';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback Window: 24 hours from migration';
    RAISE NOTICE 'After 24h: Data recovery becomes more complex';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 2. PRE-ROLLBACK ASSESSMENT
-- =================================================================

CREATE TEMP TABLE IF NOT EXISTS rollback_assessment (
    check_name TEXT PRIMARY KEY,
    current_state TEXT,
    expected_state TEXT,
    requires_rollback BOOLEAN,
    notes TEXT
);

-- 2.1 Check current database state
INSERT INTO rollback_assessment (check_name, current_state, expected_state, requires_rollback, notes)
SELECT
    'database_accessible',
    CASE WHEN current_database() IS NOT NULL THEN 'OK' ELSE 'ERROR' END,
    'OK',
    CASE WHEN current_database() IS NULL THEN true ELSE false END,
    'Database connection status';

-- 2.2 Check table integrity
INSERT INTO rollback_assessment (check_name, current_state, expected_state, requires_rollback, notes)
SELECT
    'core_tables_exist',
    COUNT(*)::TEXT || ' tables found',
    '10 tables expected',
    COUNT(*) < 10,
    'Verifying core tables: profiles, politicians, posts, comments, ratings, ai_scores, votes, bookmarks, notifications, reports'
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'profiles', 'politicians', 'posts', 'comments', 'ratings',
        'ai_scores', 'votes', 'bookmarks', 'notifications', 'reports'
    );

-- 2.3 Check data counts
INSERT INTO rollback_assessment (check_name, current_state, expected_state, requires_rollback, notes)
SELECT
    'data_integrity',
    total_rows::TEXT || ' total rows',
    'Should match pre-migration backup',
    false, -- Manual verification needed
    'Compare with backup statistics'
FROM (
    SELECT
        (SELECT COUNT(*) FROM public.profiles) +
        (SELECT COUNT(*) FROM public.politicians) +
        (SELECT COUNT(*) FROM public.posts) +
        (SELECT COUNT(*) FROM public.comments) +
        (SELECT COUNT(*) FROM public.ratings) as total_rows
) counts;

-- 2.4 Check RLS status
INSERT INTO rollback_assessment (check_name, current_state, expected_state, requires_rollback, notes)
SELECT
    'rls_policies_active',
    COUNT(*)::TEXT || ' policies found',
    'Should match expected count',
    false, -- Manual verification needed
    'Verify RLS policies are not blocking legitimate access'
FROM pg_policies
WHERE schemaname = 'public';

-- Display assessment
SELECT
    check_name,
    current_state,
    expected_state,
    CASE WHEN requires_rollback THEN 'YES - ROLLBACK NEEDED' ELSE 'OK' END as action,
    notes
FROM rollback_assessment
ORDER BY requires_rollback DESC, check_name;

-- =================================================================
-- 3. ROLLBACK METHOD SELECTION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'ROLLBACK METHOD SELECTION';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Choose appropriate rollback method based on situation:';
    RAISE NOTICE '';
    RAISE NOTICE 'METHOD A: Supabase Point-in-Time Restore (RECOMMENDED)';
    RAISE NOTICE '  - Use when: Complete database corruption';
    RAISE NOTICE '  - Downtime: 5-30 minutes';
    RAISE NOTICE '  - Data loss: Minimal (< 1 hour)';
    RAISE NOTICE '  - Steps: See section 4A below';
    RAISE NOTICE '';
    RAISE NOTICE 'METHOD B: Full pg_restore from Backup';
    RAISE NOTICE '  - Use when: Supabase restore unavailable';
    RAISE NOTICE '  - Downtime: 10-60 minutes';
    RAISE NOTICE '  - Data loss: Since last backup';
    RAISE NOTICE '  - Steps: See section 4B below';
    RAISE NOTICE '';
    RAISE NOTICE 'METHOD C: Selective Table Restore';
    RAISE NOTICE '  - Use when: Only specific tables affected';
    RAISE NOTICE '  - Downtime: 5-15 minutes';
    RAISE NOTICE '  - Data loss: Minimal';
    RAISE NOTICE '  - Steps: See section 4C below';
    RAISE NOTICE '';
    RAISE NOTICE 'METHOD D: Migration Revert (SQL)';
    RAISE NOTICE '  - Use when: Known migration SQL caused issue';
    RAISE NOTICE '  - Downtime: 1-5 minutes';
    RAISE NOTICE '  - Data loss: None';
    RAISE NOTICE '  - Steps: See section 4D below';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 4A. METHOD A: Supabase Point-in-Time Restore
-- =================================================================

-- This method uses Supabase Dashboard - no SQL needed
-- Instructions:
/*
1. Access Supabase Dashboard
   - Navigate to: https://app.supabase.com/project/[PROJECT_ID]/database/backups

2. Select Backup Point
   - Choose backup from before migration started
   - Verify timestamp is correct
   - Note: Available backups depend on your plan (7-30 days)

3. Initiate Restore
   - Click "Restore" button
   - Confirm action (this will disconnect all clients)
   - Wait for restore to complete (5-30 minutes)

4. Verify Restore
   - Check application connectivity
   - Verify critical data exists
   - Run post-restore validation (section 6)

5. Update Application
   - Clear application caches
   - Restart application servers
   - Monitor error logs

6. Post-Restore Actions
   - Document incident
   - Analyze root cause
   - Update migration procedures
*/

-- =================================================================
-- 4B. METHOD B: Full pg_restore from Backup
-- =================================================================

-- Execute via command line (not in SQL)
/*
# 1. Stop application (prevent new writes)
#    Update application to maintenance mode

# 2. Disconnect all users
psql -h db.PROJECT_ID.supabase.co -U postgres -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres' AND pid <> pg_backend_pid();"

# 3. Restore from backup
psql -h db.PROJECT_ID.supabase.co -U postgres -d postgres \
  < /path/to/backup_full_YYYYMMDD.sql

# 4. Verify restoration
psql -h db.PROJECT_ID.supabase.co -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM public.profiles;"

# 5. Restart application
#    Update application back to normal mode
*/

-- =================================================================
-- 4C. METHOD C: Selective Table Restore
-- =================================================================

BEGIN;

-- Example: Restore specific table from backup
-- WARNING: This will drop and recreate the table

-- Step 1: Backup current state (just in case)
CREATE TABLE IF NOT EXISTS profiles_rollback_backup AS
SELECT * FROM public.profiles;

-- Step 2: Drop problematic table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 3: Restore from CSV backup
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    user_type TEXT DEFAULT 'normal' CHECK (user_type IN ('normal', 'politician')),
    user_level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import data from CSV
-- Execute via psql: \COPY public.profiles FROM 'backup_profiles_YYYYMMDD.csv' WITH (FORMAT CSV, HEADER true);

-- Step 4: Restore RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "본인 프로필만 수정"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "회원가입시 프로필 생성"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Step 5: Verify restoration
SELECT COUNT(*) as restored_count FROM public.profiles;

COMMIT;

-- =================================================================
-- 4D. METHOD D: Migration Revert (SQL)
-- =================================================================

BEGIN;

-- This section contains specific rollback SQL for recent migrations
-- Add rollback statements for each migration that was applied

-- Example: If a new column was added, remove it
-- ALTER TABLE public.politicians DROP COLUMN IF EXISTS new_column;

-- Example: If an index was added, remove it
-- DROP INDEX IF EXISTS idx_new_index;

-- Example: If RLS policy was modified, restore original
-- DROP POLICY IF EXISTS "new_policy" ON public.table_name;
-- CREATE POLICY "original_policy" ON public.table_name FOR SELECT USING (true);

-- Verify revert
DO $$
BEGIN
    RAISE NOTICE 'Migration reverted successfully';
    RAISE NOTICE 'Verify application functionality';
END $$;

COMMIT;

-- =================================================================
-- 5. DATA RECOVERY (For Partial Rollback)
-- =================================================================

-- If rollback causes data loss, recover recent data from logs/backups

-- 5.1 Identify missing data period
CREATE TEMP TABLE missing_data_period AS
SELECT
    (SELECT MAX(created_at) FROM public.profiles) as profiles_latest,
    (SELECT MAX(created_at) FROM public.posts) as posts_latest,
    (SELECT MAX(created_at) FROM public.ratings) as ratings_latest;

SELECT * FROM missing_data_period;

-- 5.2 Restore recent data from incremental backup
-- Execute via psql:
-- \COPY public.ratings FROM 'backup_ratings_recent.csv' WITH (FORMAT CSV, HEADER true);

-- 5.3 Verify data recovery
SELECT
    COUNT(*) as recovered_records,
    MAX(created_at) as latest_record
FROM public.ratings
WHERE created_at > (SELECT profiles_latest FROM missing_data_period);

-- =================================================================
-- 6. POST-ROLLBACK VALIDATION
-- =================================================================

DO $$
DECLARE
    v_validation_errors INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'POST-ROLLBACK VALIDATION';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';

    -- 6.1 Check table counts match backup
    RAISE NOTICE 'Checking table row counts...';
    -- Compare with backup_statistics.csv

    -- 6.2 Check data integrity
    IF EXISTS (
        SELECT 1 FROM public.posts p
        LEFT JOIN auth.users u ON p.user_id = u.id
        WHERE u.id IS NULL
    ) THEN
        RAISE WARNING 'Found orphaned posts after rollback!';
        v_validation_errors := v_validation_errors + 1;
    END IF;

    -- 6.3 Check RLS policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
            AND policyname = '프로필 읽기 공개'
    ) THEN
        RAISE WARNING 'Expected RLS policies missing!';
        v_validation_errors := v_validation_errors + 1;
    END IF;

    -- 6.4 Check indexes
    IF (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') < 10 THEN
        RAISE WARNING 'Expected indexes missing!';
        v_validation_errors := v_validation_errors + 1;
    END IF;

    -- Final verdict
    IF v_validation_errors = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'POST-ROLLBACK VALIDATION: PASSED';
        RAISE NOTICE 'Database restored to stable state';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'POST-ROLLBACK VALIDATION: FAILED';
        RAISE NOTICE 'Found % validation errors', v_validation_errors;
        RAISE NOTICE 'Manual intervention required';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 7. APPLICATION RESTART CHECKLIST
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'APPLICATION RESTART CHECKLIST';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Before restarting application:';
    RAISE NOTICE '';
    RAISE NOTICE '[ ] 1. Database validation passed';
    RAISE NOTICE '[ ] 2. All critical tables accessible';
    RAISE NOTICE '[ ] 3. RLS policies functional';
    RAISE NOTICE '[ ] 4. Indexes rebuilt (if needed)';
    RAISE NOTICE '[ ] 5. Connection pool reset';
    RAISE NOTICE '[ ] 6. Application cache cleared';
    RAISE NOTICE '[ ] 7. Environment variables verified';
    RAISE NOTICE '[ ] 8. Monitoring alerts configured';
    RAISE NOTICE '';
    RAISE NOTICE 'After restarting application:';
    RAISE NOTICE '';
    RAISE NOTICE '[ ] 1. Health check endpoints responding';
    RAISE NOTICE '[ ] 2. User authentication working';
    RAISE NOTICE '[ ] 3. Critical features tested';
    RAISE NOTICE '[ ] 4. No error spikes in logs';
    RAISE NOTICE '[ ] 5. Database query performance normal';
    RAISE NOTICE '[ ] 6. User-facing features operational';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 8. INCIDENT DOCUMENTATION TEMPLATE
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'INCIDENT DOCUMENTATION TEMPLATE';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fill out and save to: incident_reports/P5D2_rollback_YYYYMMDD.md';
    RAISE NOTICE '';
    RAISE NOTICE '# Production Rollback Incident Report';
    RAISE NOTICE '';
    RAISE NOTICE '## Incident Summary';
    RAISE NOTICE '- Date/Time: [YYYY-MM-DD HH:MM:SS UTC]';
    RAISE NOTICE '- Duration: [X hours Y minutes]';
    RAISE NOTICE '- Affected Users: [Number or "All users"]';
    RAISE NOTICE '- Severity: [Critical/High/Medium/Low]';
    RAISE NOTICE '';
    RAISE NOTICE '## Root Cause';
    RAISE NOTICE '[Describe what caused the migration to fail]';
    RAISE NOTICE '';
    RAISE NOTICE '## Timeline';
    RAISE NOTICE '- [HH:MM] Migration started';
    RAISE NOTICE '- [HH:MM] Issue detected';
    RAISE NOTICE '- [HH:MM] Rollback decision made';
    RAISE NOTICE '- [HH:MM] Rollback initiated';
    RAISE NOTICE '- [HH:MM] Rollback completed';
    RAISE NOTICE '- [HH:MM] Application restored';
    RAISE NOTICE '';
    RAISE NOTICE '## Rollback Method Used';
    RAISE NOTICE '[Method A/B/C/D - describe details]';
    RAISE NOTICE '';
    RAISE NOTICE '## Data Loss Assessment';
    RAISE NOTICE '- Records lost: [Number and type]';
    RAISE NOTICE '- Time period affected: [From - To]';
    RAISE NOTICE '- Recovery status: [Full/Partial/None]';
    RAISE NOTICE '';
    RAISE NOTICE '## Corrective Actions';
    RAISE NOTICE '1. [Action taken to fix immediate issue]';
    RAISE NOTICE '2. [Changes made to prevent recurrence]';
    RAISE NOTICE '';
    RAISE NOTICE '## Lessons Learned';
    RAISE NOTICE '- [What went wrong]';
    RAISE NOTICE '- [What went right]';
    RAISE NOTICE '- [Process improvements needed]';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- 9. CONTACT INFORMATION (For Emergency Rollback)
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'EMERGENCY CONTACTS';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database Administrator:';
    RAISE NOTICE '  - Name: [Admin Name]';
    RAISE NOTICE '  - Email: [admin@example.com]';
    RAISE NOTICE '  - Phone: [Emergency Contact]';
    RAISE NOTICE '';
    RAISE NOTICE 'DevOps Team:';
    RAISE NOTICE '  - Slack: #devops-emergency';
    RAISE NOTICE '  - On-call: [Phone Number]';
    RAISE NOTICE '';
    RAISE NOTICE 'Supabase Support:';
    RAISE NOTICE '  - Dashboard: https://app.supabase.com';
    RAISE NOTICE '  - Support: support@supabase.com';
    RAISE NOTICE '  - Status: https://status.supabase.com';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================';
END $$;

-- =================================================================
-- ROLLBACK COMPLETE
-- =================================================================
