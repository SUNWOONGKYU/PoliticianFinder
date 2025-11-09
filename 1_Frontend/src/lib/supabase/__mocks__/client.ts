// Task: P5T1
/**
 * Supabase Client Mock
 * 작업일: 2025-11-10
 * 설명: Supabase 클라이언트 모킹
 */

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    resend: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

export const createClient = jest.fn(() => mockSupabaseClient);
export const getSupabaseClient = jest.fn(() => mockSupabaseClient);

export const getCurrentUser = jest.fn();
export const getCurrentSession = jest.fn();
export const getUserProfile = jest.fn();
export const signInWithEmail = jest.fn();
export const signUpWithEmail = jest.fn();
export const signInWithGoogle = jest.fn();
export const signOut = jest.fn();
export const sendPasswordResetEmail = jest.fn();
export const updatePassword = jest.fn();
export const resendVerificationEmail = jest.fn();
export const updateProfile = jest.fn();
export const onAuthStateChange = jest.fn();
export const isAuthenticated = jest.fn();
export const isEmailVerified = jest.fn();
export const getUserRole = jest.fn();
