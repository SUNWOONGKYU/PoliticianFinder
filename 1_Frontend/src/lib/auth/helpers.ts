// P3BA3: Auth Helper Functions for Real API
// Extract authenticated user from Supabase session

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Get authenticated user from Supabase session
 * Returns user object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = createClient();

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
  // 개발 중 임시 비활성화 (테스트 용도)
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 'fd96b732-ea3c-4f4f-89dc-81654b8189bc',
        email: 'test@politicianfinder.ai.kr',
      },
    };
  }

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
  const supabase = createClient();

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
  const supabase = createClient();

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
