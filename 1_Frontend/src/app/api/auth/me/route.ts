// P1BA1: Mock API - 인증
/**
 * Project Grid Task ID: P1BA1
 * 작업명: 현재 사용자 정보 API (Mock with Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2, P1D5
 * 설명: 현재 로그인된 사용자 정보 조회 - Phase 1용 Mock API with Supabase connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Constants
// ============================================================================
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

// ============================================================================
// GET /api/auth/me
// ============================================================================
/**
 * 현재 사용자 정보 API (Mock with Supabase)
 *
 * @description Phase 1: Mock 현재 사용자 정보 조회 - Supabase 연결 준비
 * @route GET /api/auth/me
 * @access Private (requires access_token)
 *
 * @header {string} Authorization - Bearer {access_token}
 *
 * @returns {200} { success: true, data: { user } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract Access Token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer "
    console.log('[Phase 1 Mock] User info request with token:', accessToken.substring(0, 20) + '...');

    // 2. Supabase Client Connection (Mock - Phase 1)
    const supabase = createClient();
    console.log('[Phase 1 Mock] Supabase client connected:', !!supabase);

    // 3. Mock: Get User Info (Phase 1)
    // Phase 3 will use: supabase.auth.getUser()
    // For Phase 1, return mock user data
    const mockUser = {
      id: MOCK_USER_ID,
      email: 'test@example.com',
      name: '테스트 사용자',
      avatar_url: null,
      role: 'user' as const,
      is_email_verified: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    };

    console.log('[Phase 1 Mock] User info retrieved for:', mockUser.email);

    // 4. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: mockUser,
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
