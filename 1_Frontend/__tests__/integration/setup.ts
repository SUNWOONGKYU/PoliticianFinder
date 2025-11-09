// @ts-nocheck
// Task: P5T3
/**
 * Integration Test Setup
 *
 * Configures test environment for API + Database integration tests
 * - Test database connection
 * - Test data cleanup utilities
 * - Test fixtures and factories
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Type definitions for tables that may not be in Database types yet
export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  politician_id: string | null;
  tags: string[] | null;
  moderation_status: string;
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  moderation_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// Test Database Configuration
// ============================================================================

/**
 * Test environment variables
 * Use separate test database or test project in Supabase
 */
export const TEST_CONFIG = {
  supabaseUrl: process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Validate test configuration
if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseAnonKey) {
  throw new Error(
    'Test configuration missing. Set TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY environment variables.'
  );
}

// ============================================================================
// Test Supabase Client
// ============================================================================

/**
 * Create test Supabase client with anon key (user-level permissions)
 */
export function createTestClient() {
  return createSupabaseClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Create admin Supabase client with service role key (bypass RLS)
 */
export function createAdminClient() {
  if (!TEST_CONFIG.supabaseServiceKey) {
    throw new Error('Service role key not configured for admin operations');
  }

  return createSupabaseClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// ============================================================================
// Test User Management
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  session?: any;
}

/**
 * Create a test user (bypasses RLS for setup)
 */
export async function createTestUser(
  email?: string,
  password?: string,
  name?: string
): Promise<TestUser> {
  const testEmail = email || `test-${Date.now()}@test.com`;
  const testPassword = password || 'TestPassword123!';
  const testName = name || 'Test User';

  const supabase = createTestClient();

  // Sign up test user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: testName,
      },
    },
  });

  if (signUpError || !authData.user) {
    throw new Error(`Failed to create test user: ${signUpError?.message}`);
  }

  // Create user profile in users table
  const adminClient = createAdminClient();
  const { error: profileError } = await adminClient.from('users').insert({
    id: authData.user.id,
    email: testEmail,
    name: testName,
    role: 'user',
    points: 0,
    level: 1,
    is_banned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('Failed to create user profile:', profileError);
  }

  return {
    id: authData.user.id,
    email: testEmail,
    password: testPassword,
    name: testName,
    session: authData.session,
  };
}

/**
 * Login test user and get session
 */
export async function loginTestUser(email: string, password: string) {
  const supabase = createTestClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Failed to login test user: ${error?.message}`);
  }

  return {
    user: data.user,
    session: data.session,
    accessToken: data.session.access_token,
  };
}

/**
 * Delete test user (cleanup)
 */
export async function deleteTestUser(userId: string) {
  const adminClient = createAdminClient();

  // Delete from users table first (child records)
  await adminClient.from('users').delete().eq('id', userId);

  // Delete auth user
  await adminClient.auth.admin.deleteUser(userId);
}

// ============================================================================
// Test Data Cleanup
// ============================================================================

/**
 * Clean up test data for a specific user
 */
export async function cleanupTestData(userId: string) {
  const adminClient = createAdminClient();

  // Delete in order to avoid foreign key constraints
  // 1. Comments
  await adminClient.from('comments').delete().eq('user_id', userId);

  // 2. Posts
  await adminClient.from('posts').delete().eq('user_id', userId);

  // 3. Notifications
  await adminClient.from('notifications').delete().eq('user_id', userId);

  // 4. User profile
  await adminClient.from('users').delete().eq('id', userId);

  // 5. Auth user
  try {
    await adminClient.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn('Failed to delete auth user:', error);
  }
}

/**
 * Clean up all test data (use with caution!)
 */
export async function cleanupAllTestData() {
  const adminClient = createAdminClient();

  // Only delete users with test emails
  const { data: testUsers } = await adminClient
    .from('users')
    .select('id')
    .like('email', '%@test.com');

  if (testUsers) {
    for (const user of testUsers) {
      await cleanupTestData(user.id);
    }
  }
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create test post
 */
export async function createTestPost(
  userId: string,
  accessToken: string,
  data?: Partial<{
    title: string;
    content: string;
    category: string;
    politician_id: string | null;
  }>
): Promise<Post> {
  const supabase = createSupabaseClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const postData = {
    user_id: userId,
    title: data?.title || 'Test Post Title',
    content: data?.content || 'Test post content with sufficient length for validation.',
    category: data?.category || 'general',
    politician_id: data?.politician_id || null,
    moderation_status: 'approved',
  };

  const { data: post, error } = await supabase
    .from('posts')
    .insert(postData as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test post: ${error.message}`);
  }

  return post as Post;
}

/**
 * Create test comment
 */
export async function createTestComment(
  postId: string,
  userId: string,
  accessToken: string,
  content?: string
): Promise<Comment> {
  const supabase = createSupabaseClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const commentData = {
    post_id: postId,
    user_id: userId,
    content: content || 'Test comment content',
    moderation_status: 'approved',
  };

  const { data: comment, error } = await supabase
    .from('comments')
    .insert(commentData as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test comment: ${error.message}`);
  }

  return comment as Comment;
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Wait for async operation (for testing eventual consistency)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// ============================================================================
// Jest Global Setup/Teardown Helpers
// ============================================================================

let createdTestUsers: string[] = [];

/**
 * Track created test user for cleanup
 */
export function trackTestUser(userId: string) {
  createdTestUsers.push(userId);
}

/**
 * Cleanup all tracked test users
 */
export async function cleanupTrackedUsers() {
  for (const userId of createdTestUsers) {
    try {
      await cleanupTestData(userId);
    } catch (error) {
      console.warn(`Failed to cleanup user ${userId}:`, error);
    }
  }
  createdTestUsers = [];
}
