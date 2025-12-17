// P3BA3: Auth Helper Functions for Real API
// Extract authenticated user from Supabase session

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Get authenticated user from Supabase session
 * Returns user object if authenticated, null otherwise
 * Supports both cookie-based auth and Bearer token auth
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const headersList = await headers();

  // Check for Authorization Bearer token
  const authHeader = headersList.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // If we have a Bearer token, pass it directly to getUser()
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email || '',
    };
  }

  // Otherwise use the cookie-based session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
  };
}

/**
 * Require authentication - returns error response if not authenticated
 * Use this at the start of protected routes
 */
export async function requireAuth(): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다. 로그인해 주세요.',
        },
      },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Check if user is banned or has restrictions
 */
export async function checkUserRestrictions(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('is_banned')
    .eq('user_id', userId)
    .single();

  if (error || !user) {
    return true; // Assume restricted if can't fetch user
  }

  return user.is_banned === true;
}

/**
 * Check if user is admin
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  return user.role === 'admin';
}

/**
 * Require admin authentication - returns error response if not admin
 * Use this at the start of admin-only routes
 */
export async function requireAdmin(): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const isAdmin = await checkIsAdmin(user.id);

  if (!isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '관리자 권한이 필요합니다.',
        },
      },
      { status: 403 }
    );
  }

  return { user };
}
