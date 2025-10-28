-- ============================================================================
-- File: 20250117_test_ratings_rls.sql
-- Purpose: Manual test queries for ratings RLS policies
-- Author: Security Auditor AI
-- Date: 2025-01-17
-- Task: P2E1 - ratings RLS 확장
-- ============================================================================

-- ====================
-- HOW TO USE THIS FILE
-- ====================
-- 1. Run these queries in Supabase SQL Editor
-- 2. Test with different authentication contexts:
--    - Logged out (anonymous)
--    - Logged in as User A
--    - Logged in as User B
--    - Using service_role key (admin)
-- 3. Verify each policy behaves as expected
-- ====================

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================
-- Create test users and ratings (run as service_role)

-- Test User IDs (replace with actual UUIDs from your test users)
-- User A: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- User B: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

-- Insert test ratings (run with service_role to bypass RLS)
/*
INSERT INTO ratings (user_id, politician_id, score, comment, created_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 5, 'Excellent politician - User A', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 2, 'Not satisfied - User B', NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 4, 'Good work - User A', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 3, 'Average performance - User B', NOW());
*/

-- ============================================================================
-- TEST 1: SELECT POLICY - Public Read Access
-- ============================================================================
-- Expected: All users (including anonymous) can read all ratings

-- Test as anonymous (logged out)
SELECT
    'TEST 1.1: Anonymous SELECT' as test_case,
    COUNT(*) as total_ratings,
    CASE
        WHEN COUNT(*) > 0 THEN 'PASS - Can read ratings'
        ELSE 'FAIL - Cannot read ratings'
    END as result
FROM ratings;

-- Test reading specific rating details
SELECT
    'TEST 1.2: Anonymous SELECT with details' as test_case,
    id,
    user_id,
    politician_id,
    score,
    LEFT(comment, 30) as comment_preview
FROM ratings
LIMIT 5;

-- Test with JOIN (common use case)
SELECT
    'TEST 1.3: Anonymous SELECT with JOIN' as test_case,
    r.id,
    r.score,
    p.name as politician_name
FROM ratings r
JOIN politicians p ON r.politician_id = p.id
LIMIT 5;

-- ============================================================================
-- TEST 2: INSERT POLICY - Authenticated Only + Own ID
-- ============================================================================
-- Expected: Only logged-in users can insert with their own user_id

-- Test as anonymous (should fail)
-- This will fail with RLS error
/*
INSERT INTO ratings (politician_id, score, comment)
VALUES (999, 5, 'Anonymous attempt - should fail')
RETURNING 'TEST 2.1: Anonymous INSERT' as test_case, id;
*/

-- Test as logged-in User A (should succeed)
-- Run this when authenticated as User A
/*
INSERT INTO ratings (politician_id, score, comment)
VALUES (100, 4, 'User A rating - should succeed')
RETURNING 'TEST 2.2: Authenticated INSERT' as test_case, id, user_id;
*/

-- Test user_id spoofing (should fail)
-- Run this when authenticated as User A, trying to insert as User B
/*
INSERT INTO ratings (user_id, politician_id, score, comment)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 101, 5, 'Spoofing attempt - should fail')
RETURNING 'TEST 2.3: User ID spoofing' as test_case, id;
*/

-- Test duplicate rating (should fail due to UNIQUE constraint)
-- Run this when authenticated as User A
/*
INSERT INTO ratings (politician_id, score, comment)
VALUES (1, 3, 'Duplicate rating - should fail')
RETURNING 'TEST 2.4: Duplicate rating' as test_case, id;
*/

-- ============================================================================
-- TEST 3: UPDATE POLICY - Owner Only
-- ============================================================================
-- Expected: Users can only update their own ratings

-- Find User A's ratings for testing
SELECT
    'TEST 3.0: Find test ratings' as test_case,
    id,
    user_id,
    politician_id,
    score,
    comment
FROM ratings
WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
LIMIT 1;

-- Test updating own rating (should succeed)
-- Run as User A, replace {rating_id} with actual ID
/*
UPDATE ratings
SET
    score = 4,
    comment = 'Updated by owner - should succeed',
    updated_at = NOW()
WHERE id = {rating_id}
RETURNING 'TEST 3.1: Owner UPDATE' as test_case, id, score, comment;
*/

-- Test updating another user's rating (should fail)
-- Run as User A, trying to update User B's rating
/*
UPDATE ratings
SET
    score = 1,
    comment = 'Malicious update - should fail'
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
AND politician_id = 1
RETURNING 'TEST 3.2: Cross-user UPDATE' as test_case, id;
*/

-- Test changing user_id (should fail)
-- Run as User A, trying to change ownership
/*
UPDATE ratings
SET
    user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    comment = 'Ownership transfer - should fail'
WHERE id = {rating_id}
RETURNING 'TEST 3.3: User ID change' as test_case, id, user_id;
*/

-- Test anonymous update (should fail)
-- Run when logged out
/*
UPDATE ratings
SET score = 1
WHERE id = {any_rating_id}
RETURNING 'TEST 3.4: Anonymous UPDATE' as test_case, id;
*/

-- ============================================================================
-- TEST 4: DELETE POLICY - Owner Only
-- ============================================================================
-- Expected: Users can only delete their own ratings

-- Test deleting own rating (should succeed)
-- Run as User A, replace {rating_id} with actual ID
/*
DELETE FROM ratings
WHERE id = {rating_id}
AND user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
RETURNING 'TEST 4.1: Owner DELETE' as test_case, id;
*/

-- Test deleting another user's rating (should fail)
-- Run as User A, trying to delete User B's rating
/*
DELETE FROM ratings
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
RETURNING 'TEST 4.2: Cross-user DELETE' as test_case, id;
*/

-- Test anonymous delete (should fail)
-- Run when logged out
/*
DELETE FROM ratings
WHERE id = {any_rating_id}
RETURNING 'TEST 4.3: Anonymous DELETE' as test_case, id;
*/

-- Test bulk delete (partial success expected)
-- Run as User A
/*
WITH deletion_attempt AS (
    DELETE FROM ratings
    WHERE politician_id IN (1, 2, 3)
    RETURNING id, user_id
)
SELECT
    'TEST 4.4: Bulk DELETE' as test_case,
    COUNT(*) as deleted_count,
    COUNT(DISTINCT user_id) as unique_users,
    CASE
        WHEN COUNT(DISTINCT user_id) = 1 THEN 'PASS - Only own ratings deleted'
        ELSE 'FAIL - Cross-user deletion occurred'
    END as result
FROM deletion_attempt;
*/

-- ============================================================================
-- TEST 5: EDGE CASES AND SECURITY SCENARIOS
-- ============================================================================

-- Test 5.1: SQL Injection attempt
/*
INSERT INTO ratings (politician_id, score, comment)
VALUES (1, 5, 'Normal comment''; DROP TABLE ratings; --')
RETURNING 'TEST 5.1: SQL Injection' as test_case, comment;
*/

-- Test 5.2: Check if RLS is enabled
SELECT
    'TEST 5.2: RLS Status' as test_case,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN 'PASS - RLS is enabled'
        ELSE 'FAIL - RLS is DISABLED!'
    END as result
FROM pg_tables
WHERE tablename = 'ratings';

-- Test 5.3: List all active policies
SELECT
    'TEST 5.3: Active Policies' as test_case,
    policyname,
    cmd as operation,
    roles,
    CASE permissive
        WHEN true THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as type
FROM pg_policies
WHERE tablename = 'ratings'
ORDER BY cmd;

-- Test 5.4: Verify auth.uid() is working
-- Run when authenticated
/*
SELECT
    'TEST 5.4: Auth Context' as test_case,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE
        WHEN auth.uid() IS NOT NULL THEN 'PASS - Authenticated'
        ELSE 'INFO - Not authenticated'
    END as auth_status;
*/

-- ============================================================================
-- TEST 6: PERFORMANCE TESTS
-- ============================================================================

-- Test 6.1: Query performance with RLS
EXPLAIN ANALYZE
SELECT * FROM ratings
WHERE politician_id = 1;

-- Test 6.2: Join performance with RLS
EXPLAIN ANALYZE
SELECT
    r.*,
    p.name,
    prof.username
FROM ratings r
JOIN politicians p ON r.politician_id = p.id
LEFT JOIN profiles prof ON r.user_id = prof.id
LIMIT 100;

-- Test 6.3: Aggregation performance with RLS
EXPLAIN ANALYZE
SELECT
    politician_id,
    COUNT(*) as rating_count,
    AVG(score) as avg_score,
    MIN(score) as min_score,
    MAX(score) as max_score
FROM ratings
GROUP BY politician_id
HAVING COUNT(*) > 5;

-- ============================================================================
-- TEST 7: VERIFY AUDIT FUNCTION
-- ============================================================================

-- Run the security audit
SELECT * FROM audit_ratings_rls()
ORDER BY
    CASE status
        WHEN 'FAIL' THEN 0
        WHEN 'PASS' THEN 1
    END;

-- ============================================================================
-- CLEANUP TEST DATA
-- ============================================================================
-- Remove test data after testing (run as service_role)
/*
DELETE FROM ratings
WHERE comment LIKE '%test%'
   OR comment LIKE '%Test%'
   OR comment LIKE '%should succeed%'
   OR comment LIKE '%should fail%';
*/

-- ============================================================================
-- SUMMARY: EXPECTED TEST RESULTS
-- ============================================================================
/*
Policy      | Anonymous | Authenticated | Owner | Non-Owner | Service Role
----------- | --------- | ------------- | ----- | --------- | ------------
SELECT      | ✅ PASS   | ✅ PASS      | ✅ PASS | ✅ PASS  | ✅ PASS
INSERT      | ❌ FAIL   | ✅ PASS      | N/A   | N/A      | ✅ PASS
UPDATE      | ❌ FAIL   | ❌ FAIL      | ✅ PASS | ❌ FAIL  | ✅ PASS
DELETE      | ❌ FAIL   | ❌ FAIL      | ✅ PASS | ❌ FAIL  | ✅ PASS

Legend:
✅ PASS = Operation should succeed
❌ FAIL = Operation should be blocked
N/A = Not applicable for this context
*/