// Task: P5T1
/**
 * Supabase Client Tests
 * 작업일: 2025-11-10
 * 설명: Supabase 클라이언트 및 Auth 헬퍼 함수 테스트
 */

import { createBrowserClient } from '@supabase/ssr';

// Mock the Supabase SSR module
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

// Mock database types
jest.mock('../database.types', () => ({}));

describe('Supabase Client', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
  };

  const mockSession = {
    access_token: 'token_123',
    user: mockUser,
  };

  const mockProfile = {
    id: 'user_123',
    nickname: 'testuser',
    full_name: 'Test User',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementation
    (createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
        signUp: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: 'https://oauth.url' }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        resend: jest.fn().mockResolvedValue({ data: {}, error: null }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      })),
    });
  });

  describe('Client Creation', () => {
    it('should create Supabase client with correct parameters', () => {
      const { createClient } = require('../client');
      const client = createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      expect(client).toBeDefined();
    });

    it('should return singleton instance', () => {
      const { getSupabaseClient } = require('../client');
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();

      expect(client1).toBe(client2);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const { getCurrentUser } = require('../client');
      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null on error', async () => {
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Auth error') }),
        },
      });

      // Re-require to get fresh instance
      jest.resetModules();
      const { getCurrentUser } = require('../client');
      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const { getCurrentSession } = require('../client');
      const session = await getCurrentSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null on error', async () => {
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: new Error('Session error') }),
        },
      });

      jest.resetModules();
      const { getCurrentSession } = require('../client');
      const session = await getCurrentSession();

      expect(session).toBeNull();
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in successfully', async () => {
      const { signInWithEmail } = require('../client');
      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle sign in error', async () => {
      const authError = new Error('Invalid credentials');
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: authError }),
        },
      });

      jest.resetModules();
      const { signInWithEmail } = require('../client');
      const result = await signInWithEmail('test@example.com', 'wrong');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });
  });

  describe('signUpWithEmail', () => {
    it('should sign up successfully', async () => {
      const { signUpWithEmail } = require('../client');

      // Mock window.location
      delete (window as any).location;
      window.location = { origin: 'http://localhost:3000' } as any;

      const result = await signUpWithEmail('new@example.com', 'password123', {
        nickname: 'newuser',
        full_name: 'New User',
      });

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle sign up error', async () => {
      const authError = new Error('Email already exists');
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({ data: null, error: authError }),
        },
      });

      jest.resetModules();
      const { signUpWithEmail } = require('../client');
      const result = await signUpWithEmail('existing@example.com', 'password123');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });
  });

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth', async () => {
      const { signInWithGoogle } = require('../client');

      delete (window as any).location;
      window.location = { origin: 'http://localhost:3000' } as any;

      const result = await signInWithGoogle();

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const { signOut } = require('../client');

      delete (window as any).location;
      window.location = { href: '' } as any;

      const result = await signOut();

      expect(result.error).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should handle sign out error', async () => {
      const authError = new Error('Sign out failed');
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          signOut: jest.fn().mockResolvedValue({ error: authError }),
        },
      });

      jest.resetModules();
      const { signOut } = require('../client');
      const result = await signOut();

      expect(result.error).toEqual(authError);
    });
  });

  describe('getUserProfile', () => {
    it('should get profile for current user', async () => {
      const { getUserProfile } = require('../client');
      const profile = await getUserProfile();

      expect(profile).toEqual(mockProfile);
    });

    it('should get profile for specific user', async () => {
      const { getUserProfile } = require('../client');
      const profile = await getUserProfile('user_456');

      expect(profile).toEqual(mockProfile);
    });

    it('should return null on error', async () => {
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('Profile not found') }),
        })),
      });

      jest.resetModules();
      const { getUserProfile } = require('../client');
      const profile = await getUserProfile();

      expect(profile).toBeNull();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send reset email', async () => {
      const { sendPasswordResetEmail } = require('../client');

      delete (window as any).location;
      window.location = { origin: 'http://localhost:3000' } as any;

      const result = await sendPasswordResetEmail('test@example.com');

      expect(result.error).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const { updatePassword } = require('../client');
      const result = await updatePassword('newpassword123');

      expect(result.error).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const { isAuthenticated } = require('../client');
      const authenticated = await isAuthenticated();

      expect(authenticated).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
      });

      jest.resetModules();
      const { isAuthenticated } = require('../client');
      const authenticated = await isAuthenticated();

      expect(authenticated).toBe(false);
    });
  });

  describe('isEmailVerified', () => {
    it('should return true when email is verified', async () => {
      const { isEmailVerified } = require('../client');
      const verified = await isEmailVerified();

      expect(verified).toBe(true);
    });

    it('should return false when email is not verified', async () => {
      (createBrowserClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { ...mockUser, email_confirmed_at: null } },
            error: null,
          }),
        },
      });

      jest.resetModules();
      const { isEmailVerified } = require('../client');
      const verified = await isEmailVerified();

      expect(verified).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const { getUserRole } = require('../client');
      const role = await getUserRole();

      expect(role).toBe('user');
    });
  });

  describe('onAuthStateChange', () => {
    it('should register auth state change listener', () => {
      const { onAuthStateChange } = require('../client');
      const callback = jest.fn();
      const unsubscribe = onAuthStateChange(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });
});
