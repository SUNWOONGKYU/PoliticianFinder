// P3BA1: Real API - 인증
/**
 * Project Grid Task ID: P3BA1 (Updated from P1BA1)
 * 작업명: 현재 사용자 정보 API (Real Supabase Auth)
 * 생성시간: 2025-11-07
 * 수정시간: 2025-11-17
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2, P1D5
 * 설명: 현재 로그인된 사용자 정보 조회 - Real Supabase Auth 사용
 * 변경사항: MOCK_USER_ID 제거, 실제 Supabase 세션 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/auth/me
// ============================================================================
/**
 * 현재 사용자 정보 API (Real Supabase Auth)
 *
 * @description 실제 Supabase Auth를 사용하여 현재 사용자 정보 조회
 * @route GET /api/auth/me
 * @access Private (requires authentication)
 *
 * @header {string} Authorization - Bearer {access_token} (optional, uses cookie)
 *
 * @returns {200} { success: true, data: { user } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Create Supabase client (uses cookies automatically)
    const supabase = createClient();

    // 2. Get authenticated user from Supabase session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('[현재 사용자 정보 API] 인증 실패:', error?.message);
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

    // 3. Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('nickname, role, points, level, is_banned, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[현재 사용자 정보 API] 프로필 조회 실패:', profileError);
    }

    // 4. Construct user response
    const userData = {
      id: user.id,
      email: user.email || '',
      name: profile?.nickname || user.user_metadata?.name || '사용자',
      avatar_url: user.user_metadata?.avatar_url || null,
      role: profile?.role || 'user',
      points: profile?.points || 0,
      level: profile?.level || 1,
      is_banned: profile?.is_banned || false,
      is_email_verified: !!user.email_confirmed_at,
      created_at: user.created_at,
      updated_at: profile?.updated_at || user.updated_at,
    };

    console.log('[현재 사용자 정보 API] 사용자 조회 성공:', userData.email);

    // 5. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: userData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[현재 사용자 정보 API] 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS /api/auth/me
// ============================================================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
