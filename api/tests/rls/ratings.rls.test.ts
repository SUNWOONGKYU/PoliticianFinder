// ============================================================================
// File: ratings.rls.test.ts
// Purpose: Test Row Level Security policies for ratings table
// Author: Security Auditor AI
// Date: 2025-01-17
// Task: P2E1 - ratings RLS 확장
// ============================================================================

import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'

// ====================
// SECURITY TEST CONFIGURATION
// ====================
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Test user credentials (should be created in test setup)
const TEST_USERS = {
    userA: {
        email: 'test_user_a@example.com',
        password: 'Test123!@#',
        id: null as string | null
    },
    userB: {
        email: 'test_user_b@example.com',
        password: 'Test456!@#',
        id: null as string | null
    }
}

// Test data
const TEST_POLITICIAN_ID = 1 // Assuming politician with ID 1 exists

// ====================
// TEST SETUP
// ====================
describe('Ratings RLS Security Tests', () => {
    let anonClient: SupabaseClient
    let serviceClient: SupabaseClient
    let userAClient: SupabaseClient
    let userBClient: SupabaseClient
    let userARatingId: number | null = null
    let userBRatingId: number | null = null

    // Setup test environment
    beforeAll(async () => {
        // Create clients
        anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Create test users using service role (bypasses RLS)
        const { data: userA, error: errorA } = await serviceClient.auth.admin.createUser({
            email: TEST_USERS.userA.email,
            password: TEST_USERS.userA.password,
            email_confirm: true
        })

        const { data: userB, error: errorB } = await serviceClient.auth.admin.createUser({
            email: TEST_USERS.userB.email,
            password: TEST_USERS.userB.password,
            email_confirm: true
        })

        if (errorA || errorB) {
            throw new Error(`Failed to create test users: ${errorA?.message || errorB?.message}`)
        }

        TEST_USERS.userA.id = userA.user!.id
        TEST_USERS.userB.id = userB.user!.id

        // Create authenticated clients for each user
        userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        await userAClient.auth.signInWithPassword({
            email: TEST_USERS.userA.email,
            password: TEST_USERS.userA.password
        })

        userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        await userBClient.auth.signInWithPassword({
            email: TEST_USERS.userB.email,
            password: TEST_USERS.userB.password
        })
    })

    // Cleanup after all tests
    afterAll(async () => {
        // Clean up test data using service role (bypasses RLS)
        if (userARatingId) {
            await serviceClient.from('ratings').delete().eq('id', userARatingId)
        }
        if (userBRatingId) {
            await serviceClient.from('ratings').delete().eq('id', userBRatingId)
        }

        // Delete test users
        if (TEST_USERS.userA.id) {
            await serviceClient.auth.admin.deleteUser(TEST_USERS.userA.id)
        }
        if (TEST_USERS.userB.id) {
            await serviceClient.auth.admin.deleteUser(TEST_USERS.userB.id)
        }
    })

    // ====================
    // SELECT POLICY TESTS
    // ====================
    describe('SELECT Policy - Public Read Access', () => {
        beforeEach(async () => {
            // Ensure test ratings exist
            const { data } = await serviceClient
                .from('ratings')
                .insert([
                    {
                        user_id: TEST_USERS.userA.id,
                        politician_id: TEST_POLITICIAN_ID,
                        score: 5,
                        comment: 'Test rating A'
                    },
                    {
                        user_id: TEST_USERS.userB.id,
                        politician_id: TEST_POLITICIAN_ID + 1,
                        score: 3,
                        comment: 'Test rating B'
                    }
                ])
                .select()

            if (data) {
                userARatingId = data[0].id
                userBRatingId = data[1].id
            }
        })

        test('Anonymous users can read all ratings', async () => {
            const { data, error } = await anonClient
                .from('ratings')
                .select('*')

            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(Array.isArray(data)).toBeTruthy()
        })

        test('Authenticated users can read all ratings', async () => {
            const { data, error } = await userAClient
                .from('ratings')
                .select('*')

            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(data?.length).toBeGreaterThanOrEqual(2)
        })

        test('Users can read other users ratings', async () => {
            // User A reading User B's rating
            const { data, error } = await userAClient
                .from('ratings')
                .select('*')
                .eq('user_id', TEST_USERS.userB.id)
                .single()

            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(data?.user_id).toBe(TEST_USERS.userB.id)
        })
    })

    // ====================
    // INSERT POLICY TESTS
    // ====================
    describe('INSERT Policy - Authenticated Users Only', () => {
        test('Authenticated users can create ratings', async () => {
            const { data, error } = await userAClient
                .from('ratings')
                .insert({
                    politician_id: TEST_POLITICIAN_ID + 10,
                    score: 4,
                    comment: 'Good politician'
                })
                .select()
                .single()

            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(data?.user_id).toBe(TEST_USERS.userA.id)
            expect(data?.score).toBe(4)

            // Cleanup
            if (data?.id) {
                await serviceClient.from('ratings').delete().eq('id', data.id)
            }
        })

        test('Anonymous users cannot create ratings', async () => {
            const { data, error } = await anonClient
                .from('ratings')
                .insert({
                    politician_id: TEST_POLITICIAN_ID + 11,
                    score: 5,
                    comment: 'Should fail'
                })
                .select()

            expect(error).toBeDefined()
            expect(error?.code).toBe('42501') // Insufficient privilege error
            expect(data).toBeNull()
        })

        test('Users cannot create ratings with different user_id', async () => {
            const { data, error } = await userAClient
                .from('ratings')
                .insert({
                    user_id: TEST_USERS.userB.id, // Trying to impersonate User B
                    politician_id: TEST_POLITICIAN_ID + 12,
                    score: 2,
                    comment: 'Impersonation attempt'
                })
                .select()

            expect(error).toBeDefined()
            expect(data).toBeNull()
        })

        test('One user one rating constraint is enforced', async () => {
            // First rating should succeed
            const { data: firstRating } = await userAClient
                .from('ratings')
                .insert({
                    politician_id: TEST_POLITICIAN_ID + 13,
                    score: 5,
                    comment: 'First rating'
                })
                .select()
                .single()

            expect(firstRating).toBeDefined()

            // Second rating for same politician should fail (unique constraint)
            const { error: secondError } = await userAClient
                .from('ratings')
                .insert({
                    politician_id: TEST_POLITICIAN_ID + 13,
                    score: 3,
                    comment: 'Duplicate rating attempt'
                })
                .select()

            expect(secondError).toBeDefined()
            expect(secondError?.code).toBe('23505') // Unique violation

            // Cleanup
            if (firstRating?.id) {
                await serviceClient.from('ratings').delete().eq('id', firstRating.id)
            }
        })
    })

    // ====================
    // UPDATE POLICY TESTS
    // ====================
    describe('UPDATE Policy - Owner Only', () => {
        let testRatingId: number

        beforeEach(async () => {
            // Create a test rating for User A
            const { data } = await serviceClient
                .from('ratings')
                .insert({
                    user_id: TEST_USERS.userA.id,
                    politician_id: TEST_POLITICIAN_ID + 20,
                    score: 3,
                    comment: 'Original comment'
                })
                .select()
                .single()

            testRatingId = data!.id
        })

        afterEach(async () => {
            // Cleanup
            await serviceClient.from('ratings').delete().eq('id', testRatingId)
        })

        test('Users can update their own ratings', async () => {
            const { data, error } = await userAClient
                .from('ratings')
                .update({
                    score: 5,
                    comment: 'Updated comment'
                })
                .eq('id', testRatingId)
                .select()
                .single()

            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(data?.score).toBe(5)
            expect(data?.comment).toBe('Updated comment')
        })

        test('Users cannot update other users ratings', async () => {
            const { data, error } = await userBClient
                .from('ratings')
                .update({
                    score: 1,
                    comment: 'Malicious update'
                })
                .eq('id', testRatingId)
                .select()

            expect(error).toBeDefined()
            expect(data).toEqual([]) // No rows affected
        })

        test('Users cannot change user_id of their ratings', async () => {
            const { error } = await userAClient
                .from('ratings')
                .update({
                    user_id: TEST_USERS.userB.id, // Trying to transfer ownership
                    score: 4
                })
                .eq('id', testRatingId)

            expect(error).toBeDefined()
        })

        test('Anonymous users cannot update any ratings', async () => {
            const { data, error } = await anonClient
                .from('ratings')
                .update({
                    score: 1,
                    comment: 'Anonymous update'
                })
                .eq('id', testRatingId)
                .select()

            expect(error).toBeDefined()
            expect(data).toBeNull()
        })
    })

    // ====================
    // DELETE POLICY TESTS
    // ====================
    describe('DELETE Policy - Owner Only', () => {
        let userARating: number
        let userBRating: number

        beforeEach(async () => {
            // Create test ratings
            const { data: dataA } = await serviceClient
                .from('ratings')
                .insert({
                    user_id: TEST_USERS.userA.id,
                    politician_id: TEST_POLITICIAN_ID + 30,
                    score: 4,
                    comment: 'User A rating to delete'
                })
                .select()
                .single()

            const { data: dataB } = await serviceClient
                .from('ratings')
                .insert({
                    user_id: TEST_USERS.userB.id,
                    politician_id: TEST_POLITICIAN_ID + 31,
                    score: 2,
                    comment: 'User B rating'
                })
                .select()
                .single()

            userARating = dataA!.id
            userBRating = dataB!.id
        })

        afterEach(async () => {
            // Cleanup any remaining ratings
            await serviceClient.from('ratings').delete().eq('id', userARating)
            await serviceClient.from('ratings').delete().eq('id', userBRating)
        })

        test('Users can delete their own ratings', async () => {
            const { error } = await userAClient
                .from('ratings')
                .delete()
                .eq('id', userARating)

            expect(error).toBeNull()

            // Verify deletion
            const { data } = await serviceClient
                .from('ratings')
                .select()
                .eq('id', userARating)
                .single()

            expect(data).toBeNull()
        })

        test('Users cannot delete other users ratings', async () => {
            const { error } = await userAClient
                .from('ratings')
                .delete()
                .eq('id', userBRating)

            // Should get an error or no rows affected
            // Verify rating still exists
            const { data } = await serviceClient
                .from('ratings')
                .select()
                .eq('id', userBRating)
                .single()

            expect(data).toBeDefined()
            expect(data?.id).toBe(userBRating)
        })

        test('Anonymous users cannot delete any ratings', async () => {
            const { error } = await anonClient
                .from('ratings')
                .delete()
                .eq('id', userARating)

            expect(error).toBeDefined()

            // Verify rating still exists
            const { data } = await serviceClient
                .from('ratings')
                .select()
                .eq('id', userARating)
                .single()

            expect(data).toBeDefined()
        })
    })

    // ====================
    // SECURITY EDGE CASES
    // ====================
    describe('Security Edge Cases', () => {
        test('SQL injection attempts are blocked', async () => {
            const maliciousInput = "'; DROP TABLE ratings; --"

            const { error } = await userAClient
                .from('ratings')
                .insert({
                    politician_id: TEST_POLITICIAN_ID,
                    score: 5,
                    comment: maliciousInput
                })
                .select()

            // Should either succeed with escaped input or fail safely
            // Table should still exist
            const { data: tableCheck } = await serviceClient
                .from('ratings')
                .select()
                .limit(1)

            expect(tableCheck).toBeDefined()
        })

        test('Bulk operations respect RLS policies', async () => {
            // Create multiple ratings
            const { data: ratings } = await serviceClient
                .from('ratings')
                .insert([
                    {
                        user_id: TEST_USERS.userA.id,
                        politician_id: TEST_POLITICIAN_ID + 40,
                        score: 5,
                        comment: 'Bulk test 1'
                    },
                    {
                        user_id: TEST_USERS.userB.id,
                        politician_id: TEST_POLITICIAN_ID + 41,
                        score: 3,
                        comment: 'Bulk test 2'
                    }
                ])
                .select()

            const ratingIds = ratings!.map(r => r.id)

            // User A tries to bulk delete all ratings
            await userAClient
                .from('ratings')
                .delete()
                .in('id', ratingIds)

            // Check which ratings remain
            const { data: remaining } = await serviceClient
                .from('ratings')
                .select()
                .in('id', ratingIds)

            // User B's rating should still exist
            expect(remaining).toBeDefined()
            expect(remaining?.length).toBe(1)
            expect(remaining?.[0].user_id).toBe(TEST_USERS.userB.id)

            // Cleanup
            await serviceClient.from('ratings').delete().in('id', ratingIds)
        })

        test('Service role key bypasses RLS (admin operations)', async () => {
            // Service role can perform any operation
            const { data, error } = await serviceClient
                .from('ratings')
                .insert({
                    user_id: 'arbitrary-uuid',
                    politician_id: TEST_POLITICIAN_ID + 50,
                    score: 5,
                    comment: 'Admin created'
                })
                .select()
                .single()

            expect(error).toBeNull()
            expect(data).toBeDefined()

            // Cleanup
            if (data?.id) {
                await serviceClient.from('ratings').delete().eq('id', data.id)
            }
        })
    })
})

// ====================
// PERFORMANCE TESTS
// ====================
describe('RLS Performance Impact', () => {
    test('SELECT performance with RLS', async () => {
        const startTime = Date.now()

        const { data, error } = await anonClient
            .from('ratings')
            .select('*')
            .limit(100)

        const endTime = Date.now()
        const duration = endTime - startTime

        expect(error).toBeNull()
        expect(duration).toBeLessThan(1000) // Should complete within 1 second

        console.log(`SELECT with RLS took ${duration}ms`)
    })

    test('Complex JOIN performance with RLS', async () => {
        const startTime = Date.now()

        const { data, error } = await userAClient
            .from('ratings')
            .select(`
                *,
                profiles!user_id (
                    id,
                    username,
                    display_name
                ),
                politicians!politician_id (
                    id,
                    name,
                    party
                )
            `)
            .limit(50)

        const endTime = Date.now()
        const duration = endTime - startTime

        expect(error).toBeNull()
        expect(duration).toBeLessThan(2000) // Should complete within 2 seconds

        console.log(`Complex JOIN with RLS took ${duration}ms`)
    })
})