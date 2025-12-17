// P3BA1: Real API - 회원
/**
 * Project Grid Task ID: P3BA1
 * 작업명: 사용자 프로필 조회 API (Real - Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase users 테이블 실제 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/user/profile
// ============================================================================
/**
 * 사용자 프로필 조회 API (Real - Supabase)
 *
 * @description Phase 3: users 테이블에서 프로필 조회
 * @route GET /api/user/profile
 * @access Private (requires authentication)
 *
 * @returns {200} { success: true, data: { user } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 * @returns {404} { success: false, error: { code, message } } - 프로필 없음
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Supabase Client Connection
    const supabase = await createClient();

    // 2. Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
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

    // 3. Get user profile from users table
    // Note: users 테이블의 PK는 'user_id' (auth.users.id와 연결)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (profileError) {
      console.error('[프로필 조회 API] 오류:', profileError);

      // User not found
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: '프로필을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_FETCH_FAILED',
            message: '프로필 조회에 실패했습니다.',
            details: profileError.message,
          },
        },
        { status: 500 }
      );
    }

    // 4. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userProfile.user_id, // users 테이블의 PK는 'user_id'
            email: userProfile.email,
            name: userProfile.name || userProfile.nickname,
            nickname: userProfile.nickname,
            avatar_url: userProfile.avatar_url || userProfile.profile_image_url,
            role: userProfile.role,
            points: userProfile.points,
            level: userProfile.level,
            bio: userProfile.bio,
            location: userProfile.location,
            is_banned: userProfile.is_banned,
            is_active: userProfile.is_active,
            created_at: userProfile.created_at,
            updated_at: userProfile.updated_at,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[프로필 조회 API] 오류:', error);

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
// OPTIONS /api/user/profile
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
