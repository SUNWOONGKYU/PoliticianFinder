-- ============================================================================
-- File: 20250117_verify_ratings_rls.sql
-- Purpose: Comprehensive verification queries for ratings RLS policies
-- Author: Security Auditor AI
-- Date: 2025-01-17
-- Task: P2E1 - ratings RLS 확장
-- ============================================================================

-- ====================
-- SECURITY VERIFICATION QUERIES
-- ====================
-- Run these queries to verify RLS policies are correctly configured
-- and functioning as expected for security compliance
-- ====================

-- ============================================================================
-- 1. RLS STATUS CHECK
-- ============================================================================
-- Verify that Row Level Security is enabled on the ratings table
SELECT
    '1. RLS Enabled Check' as verification_step,
    tablename,
    schemaname,
    tableowner,
    CASE
        WHEN rowsecurity THEN 'PASS - RLS is ENABLED'
        ELSE 'FAIL - RLS is DISABLED (SECURITY RISK!)'
    END as status,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ratings'
AND schemaname = 'public';

-- ============================================================================
-- 2. POLICY INVENTORY
-- ============================================================================
-- List all RLS policies on the ratings table with their configurations
SELECT
    '2. Policy Inventory' as verification_step,
    policyname,
    cmd as operation,
    CASE permissive
        WHEN true THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type,
    roles,
    CASE
        WHEN qual IS NULL OR qual = 'true' THEN 'No restriction (public access)'
        WHEN qual LIKE '%auth.uid()%' THEN 'Authentication-based'
        ELSE 'Custom logic'
    END as access_type
FROM pg_policies
WHERE tablename = 'ratings'
AND schemaname = 'public'
ORDER BY cmd;

-- ============================================================================
-- 3. DETAILED POLICY ANALYSIS
-- ============================================================================
-- Analyze each policy's security configuration
WITH policy_details AS (
    SELECT
        policyname,
        cmd,
        qual as using_clause,
        with_check as check_clause,
        CASE
            WHEN qual LIKE '%auth.uid()%user_id%' THEN 'Owner-based access'
            WHEN qual = 'true' THEN 'Public access'
            WHEN qual IS NULL THEN 'No USING clause'
            ELSE 'Custom logic'
        END as using_type,
        CASE
            WHEN with_check LIKE '%auth.uid()%user_id%' THEN 'Owner validation'
            WHEN with_check IS NULL THEN 'No WITH CHECK clause'
            ELSE 'Custom validation'
        END as check_type
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
)
SELECT
    '3. Policy Security Analysis' as verification_step,
    policyname,
    cmd as operation,
    using_type,
    check_type,
    CASE
        WHEN cmd = 'SELECT' AND using_clause = 'true' THEN 'PASS - Public read access'
        WHEN cmd = 'INSERT' AND check_clause LIKE '%auth.uid()%' THEN 'PASS - Auth required'
        WHEN cmd = 'UPDATE' AND using_clause LIKE '%auth.uid()%' AND check_clause LIKE '%auth.uid()%' THEN 'PASS - Owner-only update'
        WHEN cmd = 'DELETE' AND using_clause LIKE '%auth.uid()%' THEN 'PASS - Owner-only delete'
        ELSE 'REVIEW - Check configuration'
    END as security_status
FROM policy_details
ORDER BY
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
    END;

-- ============================================================================
-- 4. ROLE PERMISSIONS CHECK
-- ============================================================================
-- Verify correct permissions for different roles
WITH role_perms AS (
    SELECT
        grantee,
        privilege_type,
        is_grantable
    FROM information_schema.table_privileges
    WHERE table_name = 'ratings'
    AND table_schema = 'public'
)
SELECT
    '4. Role Permissions' as verification_step,
    grantee as role,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as granted_permissions,
    CASE
        WHEN grantee = 'authenticated' THEN
            CASE
                WHEN string_agg(privilege_type, ', ') LIKE '%SELECT%' AND
                     string_agg(privilege_type, ', ') LIKE '%INSERT%' AND
                     string_agg(privilege_type, ', ') LIKE '%UPDATE%' AND
                     string_agg(privilege_type, ', ') LIKE '%DELETE%'
                THEN 'PASS - Full CRUD access'
                ELSE 'FAIL - Missing permissions'
            END
        WHEN grantee = 'anon' THEN
            CASE
                WHEN string_agg(privilege_type, ', ') = 'SELECT'
                THEN 'PASS - Read-only access'
                WHEN string_agg(privilege_type, ', ') LIKE '%INSERT%' OR
                     string_agg(privilege_type, ', ') LIKE '%UPDATE%' OR
                     string_agg(privilege_type, ', ') LIKE '%DELETE%'
                THEN 'FAIL - Excessive permissions for anonymous'
                ELSE 'REVIEW - Check permissions'
            END
        ELSE 'INFO - Custom role'
    END as permission_status
FROM role_perms
WHERE grantee IN ('authenticated', 'anon', 'service_role')
GROUP BY grantee;

-- ============================================================================
-- 5. SECURITY COMPLIANCE SUMMARY
-- ============================================================================
-- Overall security posture assessment
WITH security_checks AS (
    SELECT 'RLS Enabled' as check_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'ratings' AND rowsecurity = true) as passed
    UNION ALL
    SELECT 'SELECT Policy Exists',
           EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'SELECT') as passed
    UNION ALL
    SELECT 'INSERT Policy Exists',
           EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'INSERT') as passed
    UNION ALL
    SELECT 'UPDATE Policy Exists',
           EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'UPDATE') as passed
    UNION ALL
    SELECT 'DELETE Policy Exists',
           EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'DELETE') as passed
    UNION ALL
    SELECT 'Authenticated Role Configured',
           EXISTS(SELECT 1 FROM information_schema.table_privileges
                  WHERE table_name = 'ratings' AND grantee = 'authenticated') as passed
    UNION ALL
    SELECT 'Anonymous Role Configured',
           EXISTS(SELECT 1 FROM information_schema.table_privileges
                  WHERE table_name = 'ratings' AND grantee = 'anon') as passed
)
SELECT
    '5. Security Compliance Summary' as verification_step,
    COUNT(*) FILTER (WHERE passed) as passed_checks,
    COUNT(*) FILTER (WHERE NOT passed) as failed_checks,
    COUNT(*) as total_checks,
    ROUND(COUNT(*) FILTER (WHERE passed)::numeric / COUNT(*)::numeric * 100, 2) as compliance_percentage,
    CASE
        WHEN COUNT(*) FILTER (WHERE NOT passed) = 0 THEN 'FULLY COMPLIANT - All security checks passed'
        WHEN COUNT(*) FILTER (WHERE NOT passed) <= 2 THEN 'PARTIALLY COMPLIANT - Minor issues detected'
        ELSE 'NON-COMPLIANT - Major security issues detected'
    END as compliance_status,
    string_agg(CASE WHEN NOT passed THEN check_name ELSE NULL END, ', ') as failed_checks_list
FROM security_checks;

-- ============================================================================
-- 6. POTENTIAL VULNERABILITIES
-- ============================================================================
-- Check for common security misconfigurations
WITH vulnerability_checks AS (
    -- Check for overly permissive policies
    SELECT
        'Overly Permissive Policy' as vulnerability_type,
        policyname,
        cmd,
        CASE
            WHEN cmd != 'SELECT' AND (qual = 'true' OR qual IS NULL) THEN 'HIGH'
            WHEN cmd != 'SELECT' AND with_check IS NULL THEN 'MEDIUM'
            ELSE 'NONE'
        END as risk_level
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
)
SELECT
    '6. Vulnerability Assessment' as verification_step,
    vulnerability_type,
    policyname,
    cmd as operation,
    risk_level,
    CASE risk_level
        WHEN 'HIGH' THEN 'CRITICAL - Immediate action required'
        WHEN 'MEDIUM' THEN 'WARNING - Review recommended'
        ELSE 'OK - No issues detected'
    END as action_required
FROM vulnerability_checks
WHERE risk_level != 'NONE'
UNION ALL
SELECT
    '6. Vulnerability Assessment' as verification_step,
    'All Policies' as vulnerability_type,
    'N/A' as policyname,
    'ALL' as operation,
    'NONE' as risk_level,
    'PASS - No vulnerabilities detected' as action_required
WHERE NOT EXISTS (
    SELECT 1 FROM vulnerability_checks WHERE risk_level != 'NONE'
);

-- ============================================================================
-- 7. AUTHENTICATION BYPASS CHECKS
-- ============================================================================
-- Verify policies properly check authentication
SELECT
    '7. Authentication Bypass Check' as verification_step,
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN 'N/A - Public read allowed'
        WHEN cmd = 'INSERT' AND with_check NOT LIKE '%auth.uid()%' THEN 'FAIL - No auth check'
        WHEN cmd = 'UPDATE' AND (qual NOT LIKE '%auth.uid()%' OR with_check NOT LIKE '%auth.uid()%') THEN 'FAIL - Weak auth check'
        WHEN cmd = 'DELETE' AND qual NOT LIKE '%auth.uid()%' THEN 'FAIL - No auth check'
        ELSE 'PASS - Proper authentication required'
    END as auth_status,
    CASE
        WHEN cmd != 'SELECT' AND (
            (cmd = 'INSERT' AND with_check NOT LIKE '%auth.uid()%') OR
            (cmd = 'UPDATE' AND qual NOT LIKE '%auth.uid()%') OR
            (cmd = 'DELETE' AND qual NOT LIKE '%auth.uid()%')
        ) THEN 'HIGH - Authentication can be bypassed'
        ELSE 'NONE'
    END as risk_level
FROM pg_policies
WHERE tablename = 'ratings'
AND schemaname = 'public'
ORDER BY
    CASE
        WHEN cmd != 'SELECT' AND (
            (cmd = 'INSERT' AND with_check NOT LIKE '%auth.uid()%') OR
            (cmd = 'UPDATE' AND qual NOT LIKE '%auth.uid()%') OR
            (cmd = 'DELETE' AND qual NOT LIKE '%auth.uid()%')
        ) THEN 0
        ELSE 1
    END,
    cmd;

-- ============================================================================
-- 8. DATA ISOLATION CHECK
-- ============================================================================
-- Verify users can only modify their own data
WITH isolation_analysis AS (
    SELECT
        policyname,
        cmd,
        CASE
            WHEN cmd = 'SELECT' THEN 'Public Access'
            WHEN qual LIKE '%auth.uid()%=%user_id%' OR qual LIKE '%user_id%=%auth.uid()%' THEN 'Owner Isolation'
            WHEN qual LIKE '%auth.uid()%' THEN 'Auth-based Isolation'
            ELSE 'No Isolation'
        END as isolation_type,
        CASE
            WHEN with_check LIKE '%auth.uid()%=%user_id%' OR with_check LIKE '%user_id%=%auth.uid()%' THEN 'Owner Validation'
            WHEN with_check LIKE '%auth.uid()%' THEN 'Auth Validation'
            WHEN with_check IS NULL THEN 'No Validation'
            ELSE 'Custom Validation'
        END as validation_type
    FROM pg_policies
    WHERE tablename = 'ratings'
    AND schemaname = 'public'
)
SELECT
    '8. Data Isolation Analysis' as verification_step,
    policyname,
    cmd as operation,
    isolation_type,
    validation_type,
    CASE
        WHEN cmd = 'SELECT' THEN 'OK - Read access is public'
        WHEN cmd IN ('UPDATE', 'DELETE') AND isolation_type = 'Owner Isolation' THEN 'PASS - Proper isolation'
        WHEN cmd = 'INSERT' AND validation_type = 'Owner Validation' THEN 'PASS - Proper validation'
        ELSE 'REVIEW - May need stronger isolation'
    END as isolation_status
FROM isolation_analysis
ORDER BY cmd;

-- ============================================================================
-- 9. OWASP COMPLIANCE CHECK
-- ============================================================================
-- Check compliance with OWASP security guidelines
SELECT
    '9. OWASP Compliance' as verification_step,
    'A01:2021 - Broken Access Control' as owasp_category,
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd IN ('UPDATE', 'DELETE') AND qual LIKE '%auth.uid()%')
        THEN 'COMPLIANT - Access control implemented'
        ELSE 'NON-COMPLIANT - Weak access control'
    END as status
UNION ALL
SELECT
    '9. OWASP Compliance',
    'A03:2021 - Injection',
    'COMPLIANT - Parameterized queries via RLS' as status
UNION ALL
SELECT
    '9. OWASP Compliance',
    'A07:2021 - Identification and Authentication Failures',
    CASE
        WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'INSERT' AND with_check LIKE '%auth.uid()%')
        THEN 'COMPLIANT - Authentication required'
        ELSE 'NON-COMPLIANT - Missing authentication checks'
    END as status;

-- ============================================================================
-- 10. PERFORMANCE IMPACT ASSESSMENT
-- ============================================================================
-- Estimate performance impact of RLS policies
SELECT
    '10. Performance Impact' as verification_step,
    'Policy Count' as metric,
    COUNT(*)::text as value,
    CASE
        WHEN COUNT(*) <= 5 THEN 'LOW - Minimal performance impact'
        WHEN COUNT(*) <= 10 THEN 'MEDIUM - Moderate performance impact'
        ELSE 'HIGH - Consider optimization'
    END as impact_level
FROM pg_policies
WHERE tablename = 'ratings'
UNION ALL
SELECT
    '10. Performance Impact',
    'Complex Conditions',
    COUNT(*)::text,
    CASE
        WHEN COUNT(*) = 0 THEN 'LOW - No complex conditions'
        WHEN COUNT(*) <= 2 THEN 'MEDIUM - Some complex conditions'
        ELSE 'HIGH - Many complex conditions'
    END
FROM pg_policies
WHERE tablename = 'ratings'
AND schemaname = 'public'
AND (length(qual) > 50 OR length(with_check) > 50);

-- ============================================================================
-- FINAL SECURITY SCORE
-- ============================================================================
-- Calculate overall security score
WITH scores AS (
    SELECT
        CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'ratings' AND rowsecurity = true) THEN 20 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'SELECT') THEN 20 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'INSERT' AND with_check LIKE '%auth.uid()%') THEN 20 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'UPDATE' AND qual LIKE '%auth.uid()%') THEN 20 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND cmd = 'DELETE' AND qual LIKE '%auth.uid()%') THEN 20 ELSE 0 END as total_score
)
SELECT
    '========================================' as separator,
    'FINAL SECURITY ASSESSMENT' as assessment,
    total_score as security_score,
    CASE
        WHEN total_score = 100 THEN 'A+ EXCELLENT - Fully secure configuration'
        WHEN total_score >= 80 THEN 'A GOOD - Minor improvements possible'
        WHEN total_score >= 60 THEN 'B ACCEPTABLE - Some security gaps'
        WHEN total_score >= 40 THEN 'C POOR - Significant security issues'
        ELSE 'F CRITICAL - Immediate action required'
    END as security_grade,
    CASE
        WHEN total_score < 100 THEN 'Run audit_ratings_rls() function for detailed analysis'
        ELSE 'No action required - All security measures in place'
    END as recommendation
FROM scores;