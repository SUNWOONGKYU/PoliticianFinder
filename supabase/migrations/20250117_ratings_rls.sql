-- ============================================================================
-- File: 20250117_ratings_rls.sql
-- Purpose: Enable Row Level Security (RLS) on ratings table with policies
-- Author: Security Auditor AI
-- Date: 2025-01-17
-- Task: P2E1 - ratings RLS 확장
-- ============================================================================

-- ====================
-- SECURITY AUDIT NOTES
-- ====================
-- This migration implements Row Level Security (RLS) for the ratings table
-- following OWASP guidelines and the principle of least privilege.
--
-- Security Features:
-- 1. Authentication-based access control using auth.uid()
-- 2. Ownership verification for UPDATE/DELETE operations
-- 3. Transparent read access for all users (including anonymous)
-- 4. Prevention of user_id tampering
-- 5. Defense in depth with database-level constraints
-- ====================

BEGIN;

-- ============================================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on the ratings table
-- This ensures all queries go through policy checks
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'ratings'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Failed to enable RLS on ratings table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: SELECT POLICY - Public Read Access
-- ============================================================================
-- Allow everyone (including anonymous users) to view all ratings
-- Rationale: Transparency is crucial for political rating systems
CREATE POLICY "ratings_select_policy"
ON ratings
FOR SELECT
USING (true);

COMMENT ON POLICY "ratings_select_policy" ON ratings IS
'SECURITY: Allows public read access to all ratings for transparency. No authentication required.';

-- ============================================================================
-- STEP 3: INSERT POLICY - Authenticated Users Only
-- ============================================================================
-- Only authenticated users can create ratings
-- user_id must match the current authenticated user
CREATE POLICY "ratings_insert_policy"
ON ratings
FOR INSERT
WITH CHECK (
    -- Ensure user is authenticated
    auth.uid() IS NOT NULL
    -- Ensure user_id matches authenticated user
    AND auth.uid() = user_id
);

COMMENT ON POLICY "ratings_insert_policy" ON ratings IS
'SECURITY: Only authenticated users can create ratings. Prevents user_id spoofing by validating against auth.uid().';

-- ============================================================================
-- STEP 4: UPDATE POLICY - Owner Only
-- ============================================================================
-- Users can only update their own ratings
CREATE POLICY "ratings_update_policy"
ON ratings
FOR UPDATE
USING (
    -- Check if current user owns the rating
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
)
WITH CHECK (
    -- Prevent user_id modification
    auth.uid() = user_id
);

COMMENT ON POLICY "ratings_update_policy" ON ratings IS
'SECURITY: Users can only update their own ratings. WITH CHECK prevents user_id tampering.';

-- ============================================================================
-- STEP 5: DELETE POLICY - Owner Only
-- ============================================================================
-- Users can only delete their own ratings
CREATE POLICY "ratings_delete_policy"
ON ratings
FOR DELETE
USING (
    -- Check if current user owns the rating
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
);

COMMENT ON POLICY "ratings_delete_policy" ON ratings IS
'SECURITY: Users can only delete their own ratings. Ensures ownership verification.';

-- ============================================================================
-- STEP 6: SECURITY VALIDATION
-- ============================================================================
-- Validate all policies were created successfully
DO $$
DECLARE
    policy_count INTEGER;
    expected_policies TEXT[] := ARRAY[
        'ratings_select_policy',
        'ratings_insert_policy',
        'ratings_update_policy',
        'ratings_delete_policy'
    ];
    missing_policies TEXT[];
BEGIN
    -- Count created policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    -- Check if all 4 policies exist
    IF policy_count < 4 THEN
        -- Find missing policies
        SELECT array_agg(p)
        INTO missing_policies
        FROM unnest(expected_policies) AS p
        WHERE p NOT IN (
            SELECT policyname
            FROM pg_policies
            WHERE tablename = 'ratings'
            AND schemaname = 'public'
        );

        RAISE EXCEPTION 'Missing RLS policies: %', array_to_string(missing_policies, ', ');
    END IF;

    RAISE NOTICE 'Successfully created % RLS policies for ratings table', policy_count;
END $$;

-- ============================================================================
-- STEP 7: GRANT NECESSARY PERMISSIONS
-- ============================================================================
-- Ensure authenticated users have necessary permissions
GRANT SELECT ON ratings TO authenticated;
GRANT INSERT ON ratings TO authenticated;
GRANT UPDATE ON ratings TO authenticated;
GRANT DELETE ON ratings TO authenticated;

-- Ensure anonymous users can only read
GRANT SELECT ON ratings TO anon;

-- ============================================================================
-- STEP 8: CREATE SECURITY AUDIT FUNCTION
-- ============================================================================
-- Function to audit RLS policy effectiveness
CREATE OR REPLACE FUNCTION audit_ratings_rls()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check 1: RLS enabled
    RETURN QUERY
    SELECT
        'RLS Enabled'::TEXT,
        CASE
            WHEN rowsecurity THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN rowsecurity THEN 'Row Level Security is enabled'::TEXT
            ELSE 'WARNING: Row Level Security is DISABLED!'::TEXT
        END
    FROM pg_tables
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    -- Check 2: Policy count
    RETURN QUERY
    SELECT
        'Policy Count'::TEXT,
        CASE
            WHEN COUNT(*) = 4 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        format('Found %s policies (expected 4)', COUNT(*))::TEXT
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public';

    -- Check 3: SELECT policy
    RETURN QUERY
    SELECT
        'SELECT Policy'::TEXT,
        CASE
            WHEN COUNT(*) = 1 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN COUNT(*) = 1 THEN 'Public read access enabled'::TEXT
            ELSE 'WARNING: SELECT policy missing or duplicated'::TEXT
        END
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
    AND cmd = 'SELECT'
    AND qual = 'true';

    -- Check 4: INSERT policy with auth check
    RETURN QUERY
    SELECT
        'INSERT Policy'::TEXT,
        CASE
            WHEN COUNT(*) = 1 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN COUNT(*) = 1 THEN 'Authenticated-only insert enabled'::TEXT
            ELSE 'WARNING: INSERT policy missing or misconfigured'::TEXT
        END
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
    AND cmd = 'INSERT'
    AND with_check LIKE '%auth.uid()%user_id%';

    -- Check 5: UPDATE policy with ownership check
    RETURN QUERY
    SELECT
        'UPDATE Policy'::TEXT,
        CASE
            WHEN COUNT(*) = 1 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN COUNT(*) = 1 THEN 'Owner-only update enabled'::TEXT
            ELSE 'WARNING: UPDATE policy missing or misconfigured'::TEXT
        END
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
    AND cmd = 'UPDATE'
    AND qual LIKE '%auth.uid()%user_id%';

    -- Check 6: DELETE policy with ownership check
    RETURN QUERY
    SELECT
        'DELETE Policy'::TEXT,
        CASE
            WHEN COUNT(*) = 1 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN COUNT(*) = 1 THEN 'Owner-only delete enabled'::TEXT
            ELSE 'WARNING: DELETE policy missing or misconfigured'::TEXT
        END
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
    AND cmd = 'DELETE'
    AND qual LIKE '%auth.uid()%user_id%';

    -- Check 7: Permissions for authenticated role
    RETURN QUERY
    SELECT
        'Authenticated Permissions'::TEXT,
        CASE
            WHEN bool_and(has_table_privilege('authenticated', 'ratings', priv))
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN bool_and(has_table_privilege('authenticated', 'ratings', priv))
            THEN 'All CRUD permissions granted'::TEXT
            ELSE 'WARNING: Missing permissions for authenticated users'::TEXT
        END
    FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS priv;

    -- Check 8: Permissions for anon role (read-only)
    RETURN QUERY
    SELECT
        'Anonymous Permissions'::TEXT,
        CASE
            WHEN has_table_privilege('anon', 'ratings', 'SELECT')
                AND NOT has_table_privilege('anon', 'ratings', 'INSERT')
                AND NOT has_table_privilege('anon', 'ratings', 'UPDATE')
                AND NOT has_table_privilege('anon', 'ratings', 'DELETE')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        CASE
            WHEN has_table_privilege('anon', 'ratings', 'SELECT')
                AND NOT has_table_privilege('anon', 'ratings', 'INSERT')
            THEN 'Read-only access confirmed'::TEXT
            ELSE 'WARNING: Anonymous users have incorrect permissions'::TEXT
        END;
END $$;

COMMENT ON FUNCTION audit_ratings_rls() IS
'Security audit function to validate RLS policies and permissions on ratings table';

-- ============================================================================
-- STEP 9: RUN INITIAL AUDIT
-- ============================================================================
-- Execute audit and display results
DO $$
DECLARE
    audit_record RECORD;
    failed_checks INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RATINGS RLS SECURITY AUDIT RESULTS';
    RAISE NOTICE '========================================';

    FOR audit_record IN SELECT * FROM audit_ratings_rls() LOOP
        RAISE NOTICE '% | % | %',
            rpad(audit_record.check_name, 25),
            rpad(audit_record.status, 6),
            audit_record.details;

        IF audit_record.status = 'FAIL' THEN
            failed_checks := failed_checks + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '========================================';

    IF failed_checks > 0 THEN
        RAISE EXCEPTION 'Security audit failed with % issues', failed_checks;
    ELSE
        RAISE NOTICE 'All security checks PASSED';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMIT;

-- Post-migration verification query
-- Run this to confirm RLS is working:
/*
SELECT
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    COUNT(p.*) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename = 'ratings'
GROUP BY t.tablename, t.rowsecurity;
*/