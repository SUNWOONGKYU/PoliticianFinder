// P1BA1: Mock API - 인증
/**
 * Project Grid Task ID: P1BA1
 * 작업명: Google OAuth API (Mock with Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2, P1D5
 * 설명: Mock Google OAuth 인증 - Phase 1용 Mock API with Supabase connection
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
 * Google OAuth Mock API
 *
 * @description Phase 1: Mock Google OAuth - Supabase 연결 준비
 * @route GET /api/auth/google
 * @access Public
 *
 * @returns {302} Redirect to Mock Google login page
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

    // 2. Supabase Client Connection (Mock - Phase 1)
    const supabase = createClient();
    console.log('[Phase 1 Mock] Supabase client connected:', !!supabase);
    console.log('[Phase 1 Mock] Google OAuth initiated');

    // 3. Mock Google OAuth (Phase 1)
    // Phase 3 will use: supabase.auth.signInWithOAuth({ provider: 'google' })
    const { origin } = new URL(request.url);
    const mockCode = `mock_google_code_${Date.now()}`;

    // In Phase 1, directly redirect to callback with mock code
    return NextResponse.redirect(
      `${origin}/api/auth/google/callback?code=${mockCode}`
    );
  } catch (error) {
    console.error('[Google OAuth Mock API] 오류:', error);
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
