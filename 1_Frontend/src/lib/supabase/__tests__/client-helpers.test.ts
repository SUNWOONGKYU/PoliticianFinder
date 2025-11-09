// Task: P5T1
/**
 * Supabase Client Helper Functions Tests
 * 작업일: 2025-11-10
 * 설명: Supabase 클라이언트 헬퍼 함수의 동작 검증
 */

describe('Supabase Client Helpers', () => {
  describe('Environment Configuration', () => {
    it('should have required environment variables set in test', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    });

    it('should use test environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://localhost:3000');
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-key');
    });
  });

  describe('Client Module Structure', () => {
    it('should export createClient function', () => {
      const clientModule = require('../client');
      expect(typeof clientModule.createClient).toBe('function');
    });

    it('should export getSupabaseClient function', () => {
      const clientModule = require('../client');
      expect(typeof clientModule.getSupabaseClient).toBe('function');
    });

    it('should export auth helper functions', () => {
      const clientModule = require('../client');
      expect(typeof clientModule.getCurrentUser).toBe('function');
      expect(typeof clientModule.getCurrentSession).toBe('function');
      expect(typeof clientModule.signInWithEmail).toBe('function');
      expect(typeof clientModule.signUpWithEmail).toBe('function');
      expect(typeof clientModule.signInWithGoogle).toBe('function');
      expect(typeof clientModule.signOut).toBe('function');
      expect(typeof clientModule.sendPasswordResetEmail).toBe('function');
      expect(typeof clientModule.updatePassword).toBe('function');
    });

    it('should export profile helper functions', () => {
      const clientModule = require('../client');
      expect(typeof clientModule.getUserProfile).toBe('function');
      expect(typeof clientModule.updateProfile).toBe('function');
    });

    it('should export utility functions', () => {
      const clientModule = require('../client');
      expect(typeof clientModule.isAuthenticated).toBe('function');
      expect(typeof clientModule.isEmailVerified).toBe('function');
      expect(typeof clientModule.getUserRole).toBe('function');
      expect(typeof clientModule.onAuthStateChange).toBe('function');
    });
  });

  describe('Function Signatures', () => {
    it('should have correct signInWithEmail signature', () => {
      const clientModule = require('../client');
      expect(clientModule.signInWithEmail.length).toBe(2); // email, password
    });

    it('should have correct signUpWithEmail signature', () => {
      const clientModule = require('../client');
      expect(clientModule.signUpWithEmail.length).toBe(3); // email, password, metadata
    });

    it('should have correct getUserProfile signature', () => {
      const clientModule = require('../client');
      expect(clientModule.getUserProfile.length).toBe(1); // userId (optional)
    });

    it('should have correct sendPasswordResetEmail signature', () => {
      const clientModule = require('../client');
      expect(clientModule.sendPasswordResetEmail.length).toBe(1); // email
    });

    it('should have correct updatePassword signature', () => {
      const clientModule = require('../client');
      expect(clientModule.updatePassword.length).toBe(1); // newPassword
    });

    it('should have correct onAuthStateChange signature', () => {
      const clientModule = require('../client');
      expect(clientModule.onAuthStateChange.length).toBe(1); // callback
    });
  });

  describe('Error Handling', () => {
    it('should export async functions that return promises', async () => {
      const clientModule = require('../client');

      // These functions should return promises (they're async)
      const functions = [
        clientModule.getCurrentUser,
        clientModule.getCurrentSession,
        clientModule.isAuthenticated,
        clientModule.isEmailVerified,
        clientModule.getUserRole,
      ];

      functions.forEach((fn) => {
        const result = fn();
        expect(result).toBeInstanceOf(Promise);
      });
    });
  });

  describe('Module Independence', () => {
    it('should not throw when importing module', () => {
      expect(() => {
        require('../client');
      }).not.toThrow();
    });

    it('should export all expected functions', () => {
      const clientModule = require('../client');
      const expectedExports = [
        'createClient',
        'getSupabaseClient',
        'getCurrentUser',
        'getCurrentSession',
        'getUserProfile',
        'signInWithEmail',
        'signUpWithEmail',
        'signInWithGoogle',
        'signOut',
        'sendPasswordResetEmail',
        'updatePassword',
        'resendVerificationEmail',
        'updateProfile',
        'onAuthStateChange',
        'isAuthenticated',
        'isEmailVerified',
        'getUserRole',
      ];

      expectedExports.forEach((exportName) => {
        expect(clientModule[exportName]).toBeDefined();
      });
    });
  });
});
