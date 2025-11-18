// P3BA1: Real API - Google OAuth
/**
 * Project Grid Task ID: P3BA1
 * 작업명: Google OAuth API (Real - Supabase Auth)
 * 생성시간: 2025-11-10
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase Auth를 사용한 실제 Google OAuth 인증
 *
 * 수정내역:
 * [2025-11-10] Mock 구현에서 Real Supabase Auth 구현으로 전환
 * - 실사용자 오류 보고: Google 소셜 로그인 안됨
 * - 원인: Mock 구현(P1BA1)이 프로덕션에 배포됨
 * - 조치: Supabase Auth의 signInWithOAuth 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkRateLimit,
  generateRateLimitKey,
  RATE_LIMIT_RULES,
  extractIpAddress,
} from '@/lib/security/auth';

// ============================================================================
// GET /api/auth/google
// ============================================================================
/**
 * Google OAuth Real API (Supabase Auth)
 *
 * @description Phase 3: Supabase Auth 기반 Google OAuth 인증
 * @route GET /api/auth/google
 * @access Public
 *
 * @returns {302} Redirect to Google OAuth consent screen
 * @returns {429} { success: false, error: { code, message } } - Rate limit
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate Limiting (5분에 5회)
    const ip = extractIpAddress(request);
    const rateLimitKey = generateRateLimitKey(ip, 'login');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_RULES.login);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.message,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // 2. Supabase Client Connection (Real - Phase 3)
    const supabase = createClient();

    // 3. Get current origin from request for dynamic redirect URL
    const { origin } = new URL(request.url);

    // 3. Initiate Google OAuth with Supabase Auth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/google/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    // 4. Handle OAuth errors
    if (error) {
      console.error('[Google OAuth Real API] 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OAUTH_INITIATION_FAILED',
            message: 'Google 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. Redirect to Google OAuth consent screen
    if (data.url) {
      console.log('[Google OAuth Real API] 인증 시작:', data.url.substring(0, 50) + '...');
      return NextResponse.redirect(data.url);
    }

    // 6. No redirect URL (unexpected error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OAUTH_URL_MISSING',
          message: 'Google 로그인 URL을 생성할 수 없습니다.',
        },
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Google OAuth Real API] 오류:', error);
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
// OPTIONS /api/auth/google
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
