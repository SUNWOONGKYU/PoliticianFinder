// @ts-nocheck
// Task: P5T3
/**
 * Integration Test: Authentication Flow
 *
 * Tests complete authentication flow with real Supabase database
 * - User registration → DB user creation
 * - Login → JWT token generation
 * - Profile update → DB update verification
 * - Logout → Session cleanup
 */

import {
  createTestClient,
  createAdminClient,
  createTestUser,
  loginTestUser,
  cleanupTestData,
  generateTestEmail,
  trackTestUser,
  cleanupTrackedUsers,
} from './setup';

describe('Integration: Auth Flow (P5T3)', () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    // Cleanup test user after each test
    if (testUserId) {
      await cleanupTestData(testUserId);
      testUserId = null;
    }
  });

  afterAll(async () => {
    // Final cleanup of any tracked users
    await cleanupTrackedUsers();
  });

  describe('User Registration Flow', () => {
    it('should register user and create database record', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';
      const name = 'Integration Test User';

      // Create test user
      const user = await createTestUser(email, password, name);
      testUserId = user.id;
      trackTestUser(user.id);

      // Verify user was created
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);

      // Verify user exists in database
      const adminClient = createAdminClient();
      const { data: dbUser, error } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(error).toBeNull();
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(email);
      expect(dbUser?.name).toBe(name);
      expect(dbUser?.role).toBe('user');
      expect(dbUser?.is_banned).toBe(false);
      expect(dbUser?.points).toBe(0);
      expect(dbUser?.level).toBe(1);
    });

    it('should prevent duplicate email registration', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create first user
      const user1 = await createTestUser(email, password);
      testUserId = user1.id;
      trackTestUser(user1.id);

      // Try to create second user with same email
      await expect(async () => {
        await createTestUser(email, password);
      }).rejects.toThrow();
    });

    it('should validate password requirements', async () => {
      const email = generateTestEmail();
      const weakPassword = 'weak';

      const supabase = createTestClient();

      // Attempt signup with weak password
      const { data, error } = await supabase.auth.signUp({
        email,
        password: weakPassword,
      });

      // Should fail validation
      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });
  });

  describe('Login Flow', () => {
    it('should login with correct credentials and return JWT token', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create test user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      // Login
      const loginResult = await loginTestUser(email, password);

      // Verify login result
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.id).toBe(user.id);
      expect(loginResult.user.email).toBe(email);
      expect(loginResult.session).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.session.access_token).toBeTruthy();
      expect(loginResult.session.refresh_token).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const email = generateTestEmail();
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';

      // Create test user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      // Attempt login with wrong password
      await expect(async () => {
        await loginTestUser(email, wrongPassword);
      }).rejects.toThrow();
    });

    it('should reject login for non-existent user', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Attempt login without creating user
      await expect(async () => {
        await loginTestUser(email, password);
      }).rejects.toThrow();
    });

    it('should maintain session across requests', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create and login user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      const loginResult = await loginTestUser(email, password);

      // Use session to make authenticated request
      const supabase = createTestClient();
      await supabase.auth.setSession(loginResult.session);

      const { data: sessionUser, error } = await supabase.auth.getUser();

      expect(error).toBeNull();
      expect(sessionUser.user).toBeDefined();
      expect(sessionUser.user?.id).toBe(user.id);
    });
  });

  describe('Profile Update Flow', () => {
    it('should update user profile and verify in database', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create and login user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      const loginResult = await loginTestUser(email, password);

      // Update profile in database
      const adminClient = createAdminClient();
      const newName = 'Updated Test User';
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          name: newName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      expect(updateError).toBeNull();

      // Verify update in database
      const { data: updatedUser, error: fetchError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(fetchError).toBeNull();
      expect(updatedUser?.name).toBe(newName);
      expect(updatedUser?.updated_at).not.toBe(user.session?.user.updated_at);
    });

    it('should update user points and level', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      // Update points and level
      const adminClient = createAdminClient();
      const newPoints = 100;
      const newLevel = 2;

      const { error: updateError } = await adminClient
        .from('users')
        .update({
          points: newPoints,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      expect(updateError).toBeNull();

      // Verify update
      const { data: updatedUser, error: fetchError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(fetchError).toBeNull();
      expect(updatedUser?.points).toBe(newPoints);
      expect(updatedUser?.level).toBe(newLevel);
    });
  });

  describe('Logout Flow', () => {
    it('should logout and clear session', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create and login user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      const loginResult = await loginTestUser(email, password);

      // Create client with session
      const supabase = createTestClient();
      await supabase.auth.setSession(loginResult.session);

      // Verify user is logged in
      const { data: beforeLogout } = await supabase.auth.getUser();
      expect(beforeLogout.user).toBeDefined();

      // Logout
      const { error: logoutError } = await supabase.auth.signOut();
      expect(logoutError).toBeNull();

      // Verify session is cleared
      const { data: afterLogout } = await supabase.auth.getUser();
      expect(afterLogout.user).toBeNull();
    });

    it('should invalidate access token after logout', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create and login user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      const loginResult = await loginTestUser(email, password);
      const oldAccessToken = loginResult.accessToken;

      // Create client with session
      const supabase = createTestClient();
      await supabase.auth.setSession(loginResult.session);

      // Logout
      await supabase.auth.signOut();

      // Try to use old access token
      const { data, error } = await supabase.auth.getUser(oldAccessToken);

      // Token should be invalid
      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });
  });

  describe('Complete Auth Flow', () => {
    it('should complete full registration → login → update → logout flow', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';
      const initialName = 'Initial User';
      const updatedName = 'Updated User';

      // 1. Registration
      const user = await createTestUser(email, password, initialName);
      testUserId = user.id;
      trackTestUser(user.id);

      expect(user.id).toBeDefined();

      // Verify in database
      const adminClient = createAdminClient();
      const { data: dbUser } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(dbUser?.name).toBe(initialName);

      // 2. Login
      const loginResult = await loginTestUser(email, password);
      expect(loginResult.accessToken).toBeDefined();

      // 3. Profile Update
      const { error: updateError } = await adminClient
        .from('users')
        .update({ name: updatedName })
        .eq('id', user.id);

      expect(updateError).toBeNull();

      // Verify update
      const { data: updatedUser } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(updatedUser?.name).toBe(updatedName);

      // 4. Logout
      const supabase = createTestClient();
      await supabase.auth.setSession(loginResult.session);

      const { error: logoutError } = await supabase.auth.signOut();
      expect(logoutError).toBeNull();

      // Verify session cleared
      const { data: afterLogout } = await supabase.auth.getUser();
      expect(afterLogout.user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should refresh access token using refresh token', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create and login user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      const loginResult = await loginTestUser(email, password);
      const refreshToken = loginResult.session.refresh_token;

      // Create new client and refresh session
      const supabase = createTestClient();
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.session?.access_token).toBeDefined();
      expect(data.session?.access_token).not.toBe(loginResult.accessToken);
    });
  });

  describe('User Ban Flow', () => {
    it('should mark user as banned in database', async () => {
      const email = generateTestEmail();
      const password = 'TestPassword123!';

      // Create user
      const user = await createTestUser(email, password);
      testUserId = user.id;
      trackTestUser(user.id);

      // Ban user
      const adminClient = createAdminClient();
      const { error: banError } = await adminClient
        .from('users')
        .update({
          is_banned: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      expect(banError).toBeNull();

      // Verify ban status
      const { data: bannedUser, error: fetchError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(fetchError).toBeNull();
      expect(bannedUser?.is_banned).toBe(true);
    });
  });
});
