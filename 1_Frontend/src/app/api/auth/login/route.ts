// P3BA1: Real API - 회원
/**
 * Project Grid Task ID: P3BA1
 * 작업명: 로그인 API (Real - Supabase Auth)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase Auth 실제 로그인 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  validateEmail,
  checkRateLimit,
  generateRateLimitKey,
  RATE_LIMIT_RULES,
  extractIpAddress,
} from '@/lib/security/auth';

// ============================================================================
// Constants
// ============================================================================
// No mock constants - using real Supabase Auth

// ============================================================================
// Request Schema (Zod)
// ============================================================================
const loginSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해 주세요.')
    .min(1, '이메일은 필수 항목입니다.'),

  password: z.string().min(1, '비밀번호는 필수 항목입니다.'),

  remember_me: z.boolean().optional().default(false),
});

type LoginRequest = z.infer<typeof loginSchema>;

// ============================================================================
// POST /api/auth/login
// ============================================================================
/**
 * 로그인 API (Real - Supabase Auth)
 *
 * @description Phase 3: Supabase Auth 실제 로그인 연동
 * @route POST /api/auth/login
 * @access Public
 *
 * @param {string} email - 사용자 이메일
 * @param {string} password - 비밀번호
 * @param {boolean} [remember_me] - 로그인 유지 (30일)
 *
 * @returns {200} { success: true, data: { user, session, message } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 * @returns {429} { success: false, error: { code, message } } - Rate limit
 */
export async function POST(request: NextRequest) {
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

    // 2. Request Body Parsing
    const body = await request.json();

    // 3. Input Validation (Zod)
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data: LoginRequest = validationResult.data;

    // 4. Email Format Validation
    if (!validateEmail(data.email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: '유효한 이메일 주소를 입력해 주세요.',
          },
        },
        { status: 400 }
      );
    }

    // 5. Supabase Client Connection (Real - Phase 3)
    const supabase = await createClient();

    // 6. Authenticate with Supabase Auth (Real - Phase 3)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    // 7. Handle Authentication Errors
    if (authError) {
      console.error('[로그인 API] Supabase Auth 오류:', authError);

      // Invalid credentials
      if (
        authError.message.includes('Invalid login credentials') ||
        authError.message.includes('invalid') ||
        authError.status === 400
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: '이메일 또는 비밀번호가 올바르지 않습니다.',
              debug: {
                supabaseError: authError.message,
                status: authError.status,
                code: authError.code,
              }
            },
          },
          { status: 401 }
        );
      }

      // Email not confirmed
      if (authError.message.includes('email not confirmed')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_NOT_CONFIRMED',
              message: '이메일 인증이 필요합니다. 이메일을 확인해 주세요.',
            },
          },
          { status: 401 }
        );
      }

      // Other auth errors
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            details: authError.message,
          },
        },
        { status: 401 }
      );
    }

    // 8. Verify user and session
    if (!authData.user || !authData.session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: '로그인에 실패했습니다.',
          },
        },
        { status: 401 }
      );
    }

    // 8-1. Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_NOT_CONFIRMED',
            message: '이메일 인증이 필요합니다. 가입하신 이메일에서 인증 링크를 클릭해 주세요.',
          },
        },
        { status: 403 }
      );
    }

    // 9. Get user profile from users table (optional - fallback to auth.users)
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    // 9-1. If no profile in users table, create one from auth.users data
    if (!userProfile) {
      console.log('[로그인 API] users 테이블에 프로필 없음, 생성 시도:', authData.user.id);

      const adminClient = await createClient();
      const { data: newProfile, error: insertError} = await adminClient
        .from('users')
        .insert({
          user_id: authData.user.id,
          email: authData.user.email,
          nickname: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
          role: 'user',
          points: 0,
          level: 1,
          is_banned: false,
          is_active: true,
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('[로그인 API] users 테이블 프로필 생성 실패:', insertError);
        // Continue with auth.users data only
      } else {
        console.log('[로그인 API] users 테이블 프로필 생성 성공');
      }
    }

    console.log('[로그인 API] 로그인 성공:', {
      id: authData.user.id,
      email: authData.user.email?.substring(0, 3) + '***@***',
    });

    // 10. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: userProfile?.name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
            avatar_url: userProfile?.avatar_url || null,
            role: userProfile?.role || 'user',
            is_email_verified: authData.user.email_confirmed_at !== null,
          },
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_in: authData.session.expires_in,
            expires_at: authData.session.expires_at,
          },
          message: '로그인에 성공했습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[로그인 API] 오류:', error);

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
// OPTIONS /api/auth/login
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
