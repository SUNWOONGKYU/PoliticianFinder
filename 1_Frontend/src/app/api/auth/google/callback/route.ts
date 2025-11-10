// P3BA1: Real API - Google OAuth Callback
/**
 * Project Grid Task ID: P3BA1
 * 작업명: Google OAuth Callback API (Real - Supabase Auth)
 * 생성시간: 2025-11-10
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase Auth를 사용한 실제 Google OAuth 콜백 처리
 *
 * 수정내역:
 * [2025-11-10] Mock 구현에서 Real Supabase Auth 구현으로 전환
 * - 실사용자 오류 보고: Google 소셜 로그인 안됨
 * - 원인: Mock 구현(P1BA1)이 프로덕션에 배포됨
 * - 조치: Supabase Auth의 exchangeCodeForSession 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/auth/google/callback
// ============================================================================
/**
 * Google OAuth Callback Real API (Supabase Auth)
 *
 * @description Phase 3: Supabase Auth 기반 Google OAuth 콜백 처리
 * @route GET /api/auth/google/callback?code=xxx
 * @access Public
 *
 * @returns {302} Redirect to /dashboard (success) or /login (error)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract code and error parameters
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 2. Handle OAuth error
    if (error) {
      console.error('[Google OAuth Callback] OAuth 에러:', error, errorDescription);
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          errorDescription || 'Google 로그인에 실패했습니다.'
        )}`
      );
    }

    // 3. Check for code
    if (!code) {
      console.error('[Google OAuth Callback] OAuth code 없음');
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          '인증 코드를 받지 못했습니다.'
        )}`
      );
    }

    // 4. Supabase Client Connection (Real - Phase 3)
    const supabase = createClient();

    // 5. Exchange code for session with Supabase Auth
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    // 6. Handle exchange error
    if (exchangeError) {
      console.error('[Google OAuth Callback] 세션 교환 실패:', exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          'Google 로그인 처리에 실패했습니다. 다시 시도해 주세요.'
        )}`
      );
    }

    // 7. Verify session and user
    if (!data.session || !data.user) {
      console.error('[Google OAuth Callback] 세션 또는 사용자 정보 없음');
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          '사용자 정보를 가져올 수 없습니다.'
        )}`
      );
    }

    // 8. Create or update user profile in users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // If user doesn't exist in users table, create profile
    if (!existingUser && !userCheckError) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
        role: 'user',
        points: 0,
        level: 1,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Log profile creation error (non-critical - auth user already created)
      if (profileError) {
        console.error('[Google OAuth Callback] users 테이블 삽입 오류:', profileError);
        // Continue - user is authenticated, profile can be created later
      } else {
        console.log('[Google OAuth Callback] 신규 사용자 프로필 생성 완료:', data.user.id);
      }
    }

    console.log('[Google OAuth Callback] 로그인 성공:', {
      userId: data.user.id,
      email: data.user.email,
      provider: 'google',
    });

    // 9. Success - Redirect to homepage or dashboard
    return NextResponse.redirect(`${origin}/?google_login=success`);
  } catch (error) {
    console.error('[Google OAuth Callback] 오류:', error);

    const { origin } = new URL(request.url);
    return NextResponse.redirect(
      `${origin}/login?error=server_error&message=${encodeURIComponent(
        '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      )}`
    );
  }
}

// ============================================================================
// OPTIONS /api/auth/google/callback
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
