// P3BA1: Real API - 회원
/**
 * Project Grid Task ID: P3BA1
 * 작업명: 로그아웃 API (Real - Supabase Auth)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase Auth 실제 로그아웃 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// POST /api/auth/logout
// ============================================================================
/**
 * 로그아웃 API (Real - Supabase Auth)
 *
 * @description Phase 3: Supabase Auth 실제 로그아웃 연동
 * @route POST /api/auth/logout
 * @access Private (requires authentication)
 *
 * @header {string} Authorization - Bearer {access_token} (optional, cookie preferred)
 *
 * @returns {200} { success: true, data: { message } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Supabase Client Connection (Real - Phase 3)
    const supabase = createClient();

    // 2. Get current user to verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Note: We don't return error if user is not authenticated
    // This allows logout to be idempotent (can be called multiple times)
    if (userError || !user) {
      console.log('[로그아웃 API] 이미 로그아웃 상태입니다.');
      return NextResponse.json(
        {
          success: true,
          data: {
            message: '로그아웃되었습니다.',
          },
        },
        { status: 200 }
      );
    }

    console.log('[로그아웃 API] 로그아웃 시도:', user.id);

    // 3. Sign out with Supabase Auth (Real - Phase 3)
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('[로그아웃 API] Supabase Auth 오류:', signOutError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            details: signOutError.message,
          },
        },
        { status: 500 }
      );
    }

    console.log('[로그아웃 API] 로그아웃 완료:', user.id);

    // 4. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: '로그아웃되었습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[로그아웃 API] 오류:', error);

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
// OPTIONS /api/auth/logout
// ============================================================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
