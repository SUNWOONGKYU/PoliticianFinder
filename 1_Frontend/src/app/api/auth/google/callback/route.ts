/**
 * Project Grid Task ID: P1BA1 (Part of P1BA1 - 인증 API 통합)
 * 작업명: Google OAuth Callback API (Mock)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2
 * 설명: Mock Google OAuth Callback - Phase 1용 Mock API
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockUsers, createMockSession } from '@/lib/mock/authStore';

// ============================================================================
// GET /api/auth/google/callback
// ============================================================================
/**
 * Google OAuth Callback Mock API
 *
 * @description Mock Google OAuth Callback - Mock 사용자 생성 및 로그인
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
      console.error('Google OAuth 에러:', error, errorDescription);
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          errorDescription || 'Google 로그인에 실패했습니다.'
        )}`
      );
    }

    // 3. Check for code
    if (!code) {
      console.error('OAuth code 없음');
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&message=${encodeURIComponent(
          '인증 코드를 받지 못했습니다.'
        )}`
      );
    }

    // 4. Create or find Mock Google user
    const mockGoogleEmail = 'google.user@example.com';
    let user = mockUsers[mockGoogleEmail];

    if (!user) {
      // Create new Google user (Mock)
      const userId = `user-google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id: userId,
        email: mockGoogleEmail,
        name: 'Google 사용자 (Mock)',
        password: null, // Google OAuth users don't have passwords
        marketing_agreed: false,
        role: 'user' as const,
        is_email_verified: true, // Google OAuth users are pre-verified
        created_at: new Date().toISOString(),
        avatar_url: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
      };
      mockUsers[mockGoogleEmail] = user;
    }

    // 5. Create Mock session
    const session = createMockSession(user.id, true);

    // 6. Success - Redirect to dashboard
    // Note: In a real app, you'd set HTTP-only cookies here
    return NextResponse.redirect(`${origin}/dashboard?google_login=success`);
  } catch (error) {
    console.error('Google OAuth Callback 오류:', error);

    const { origin } = new URL(request.url);
    return NextResponse.redirect(
      `${origin}/login?error=server_error&message=${encodeURIComponent(
        '서버 오류가 발생했습니다.'
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
