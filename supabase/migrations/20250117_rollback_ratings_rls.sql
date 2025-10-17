-- ============================================================================
-- File: 20250117_rollback_ratings_rls.sql
-- Purpose: Rollback RLS policies on ratings table
-- Author: Security Auditor AI
-- Date: 2025-01-17
-- Task: P2E1 - ratings RLS 확장 (Rollback)
-- ============================================================================

-- ====================
-- SECURITY NOTES
-- ====================
-- This rollback script safely removes RLS policies from the ratings table.
-- Use this only when necessary, as it removes important security controls.
-- After rollback, the table will have no access restrictions.
-- ====================

BEGIN;

-- ============================================================================
-- STEP 1: DOCUMENT CURRENT STATE
-- ============================================================================
-- Log current RLS status before rollback
DO $$
DECLARE
    current_policies INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    -- Get current policy count
    SELECT COUNT(*) INTO current_policies
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    -- Get RLS status
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    RAISE NOTICE 'Pre-rollback status:';
    RAISE NOTICE '  - RLS Enabled: %', rls_enabled;
    RAISE NOTICE '  - Active Policies: %', current_policies;
END $$;

-- ============================================================================
-- STEP 2: DROP RLS POLICIES
-- ============================================================================
-- Remove all RLS policies in reverse order of creation
-- Using IF EXISTS to prevent errors if policies were already removed

-- Drop DELETE policy
DROP POLICY IF EXISTS "ratings_delete_policy" ON ratings;
RAISE NOTICE 'Dropped policy: ratings_delete_policy';

-- Drop UPDATE policy
DROP POLICY IF EXISTS "ratings_update_policy" ON ratings;
RAISE NOTICE 'Dropped policy: ratings_update_policy';

-- Drop INSERT policy
DROP POLICY IF EXISTS "ratings_insert_policy" ON ratings;
RAISE NOTICE 'Dropped policy: ratings_insert_policy';

-- Drop SELECT policy
DROP POLICY IF EXISTS "ratings_select_policy" ON ratings;
RAISE NOTICE 'Dropped policy: ratings_select_policy';

-- ============================================================================
-- STEP 3: VERIFY ALL POLICIES REMOVED
-- ============================================================================
DO $$
DECLARE
    remaining_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_policies
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    IF remaining_policies > 0 THEN
        RAISE WARNING 'Found % remaining policies on ratings table', remaining_policies;

        -- List remaining policies
        FOR r IN
            SELECT policyname
            FROM pg_policies
            WHERE tablename = 'ratings'
            AND schemaname = 'public'
        LOOP
            RAISE WARNING '  - Policy still exists: %', r.policyname;
        END LOOP;
    ELSE
        RAISE NOTICE 'All RLS policies successfully removed';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: DROP AUDIT FUNCTION
-- ============================================================================
-- Remove the security audit function
DROP FUNCTION IF EXISTS audit_ratings_rls();
RAISE NOTICE 'Dropped function: audit_ratings_rls()';

-- ============================================================================
-- STEP 5: DISABLE ROW LEVEL SECURITY (OPTIONAL)
-- ============================================================================
-- NOTE: Uncomment the following line only in development environments
-- In production, it's safer to keep RLS enabled even without policies
-- to prevent accidental unrestricted access

-- Development environment only:
-- ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
-- RAISE NOTICE 'Row Level Security DISABLED on ratings table';

-- Production environment (recommended):
-- Keep RLS enabled but without policies
-- This maintains a security-first approach
RAISE NOTICE 'Row Level Security remains ENABLED (no policies active)';

-- ============================================================================
-- STEP 6: REVOKE PERMISSIONS (OPTIONAL)
-- ============================================================================
-- NOTE: Only revoke if you want to completely lock down the table
-- This section is commented out by default to avoid breaking existing functionality

-- Revoke write permissions from authenticated users
-- REVOKE INSERT, UPDATE, DELETE ON ratings FROM authenticated;
-- RAISE NOTICE 'Write permissions revoked from authenticated users';

-- Revoke all permissions from anonymous users
-- REVOKE ALL ON ratings FROM anon;
-- RAISE NOTICE 'All permissions revoked from anonymous users';

-- ============================================================================
-- STEP 7: FINAL VERIFICATION
-- ============================================================================
DO $$
DECLARE
    final_policies INTEGER;
    rls_status BOOLEAN;
BEGIN
    -- Check final policy count
    SELECT COUNT(*) INTO final_policies
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    -- Check RLS status
    SELECT rowsecurity INTO rls_status
    FROM pg_tables
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Final status:';
    RAISE NOTICE '  - RLS Status: %', CASE WHEN rls_status THEN 'ENABLED' ELSE 'DISABLED' END;
    RAISE NOTICE '  - Active Policies: %', final_policies;

    IF final_policies = 0 THEN
        RAISE NOTICE '  - Result: SUCCESS - All policies removed';
    ELSE
        RAISE WARNING '  - Result: PARTIAL - Some policies remain';
    END IF;

    -- Security warning
    IF NOT rls_status OR final_policies = 0 THEN
        RAISE NOTICE '';
        RAISE WARNING '========================================';
        RAISE WARNING 'SECURITY WARNING';
        RAISE WARNING '========================================';
        RAISE WARNING 'The ratings table now has NO access restrictions!';
        RAISE WARNING 'Any authenticated user can perform any operation.';
        RAISE WARNING 'Consider re-applying RLS policies or implementing';
        RAISE WARNING 'alternative security measures.';
        RAISE WARNING '========================================';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

COMMIT;

-- Post-rollback verification queries:
/*
-- Check RLS status
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ratings';

-- Check for any remaining policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'ratings';

-- Check current permissions
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'ratings'
ORDER BY grantee, privilege_type;
*/