// P1BA1: Mock API - 인증
/**
 * Project Grid Task ID: P1BA1
 * 작업명: 비밀번호 재설정 API (Mock with Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2, P1D5
 * 설명: Mock 비밀번호 재설정 - Phase 1용 Mock API with Supabase connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  validateEmail,
  validatePasswordStrength,
  checkRateLimit,
  generateRateLimitKey,
  RATE_LIMIT_RULES,
  extractIpAddress,
} from '@/lib/security/auth';

// ============================================================================
// Request Schemas (Zod)
// ============================================================================

// POST: Password reset request
const resetRequestSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해 주세요.')
    .min(1, '이메일은 필수 항목입니다.'),
});

// PUT: Password reset confirmation
const resetConfirmSchema = z.object({
  email: z.string().email().min(1),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .max(128, '비밀번호는 최대 128자까지 가능합니다.'),

  password_confirm: z.string().min(1, '비밀번호 확인은 필수 항목입니다.'),
});

type ResetRequestData = z.infer<typeof resetRequestSchema>;
type ResetConfirmData = z.infer<typeof resetConfirmSchema>;

// ============================================================================
// POST /api/auth/reset-password
// ============================================================================
/**
 * 비밀번호 재설정 요청 API (Mock with Supabase)
 *
 * @description Phase 1: Mock 비밀번호 재설정 요청 - Supabase 연결 준비
 * @route POST /api/auth/reset-password
 * @access Public
 *
 * @param {string} email - 사용자 이메일
 *
 * @returns {200} { success: true, data: { message } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {429} { success: false, error: { code, message } } - Rate limit
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting (10분에 3회)
    const ip = extractIpAddress(request);
    const rateLimitKey = generateRateLimitKey(ip, 'passwordReset');
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_RULES.passwordReset
    );

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
    const validationResult = resetRequestSchema.safeParse(body);

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

    const data: ResetRequestData = validationResult.data;

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

    // 5. Supabase Client Connection
    const supabase = await createClient();
    console.log('[비밀번호 재설정] Supabase client connected:', !!supabase);
    console.log('[비밀번호 재설정] Password reset requested for:', data.email?.substring(0, 3) + '***@***');

    // 6. Real Supabase password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://politicianfinder.com'}/auth/password-reset`,
    });

    if (resetError) {
      console.error('[비밀번호 재설정] Supabase error:', resetError);
      // For security, don't reveal if email exists or not
      // Just log the error and return success message
    }

    // 7. Success Response (always, for security - don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        data: {
          message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인해 주세요.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[비밀번호 재설정 요청 API] 오류:', error);

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
// PUT /api/auth/reset-password
// ============================================================================
/**
 * 비밀번호 재설정 확인 API (Mock with Supabase)
 *
 * @description Phase 1: Mock 비밀번호 재설정 - Supabase 연결 준비
 * @route PUT /api/auth/reset-password
 * @access Public
 *
 * @param {string} email - 사용자 이메일
 * @param {string} password - 새 비밀번호
 * @param {string} password_confirm - 새 비밀번호 확인
 *
 * @returns {200} { success: true, data: { message } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {404} { success: false, error: { code, message } } - 사용자 없음
 * @returns {429} { success: false, error: { code, message } } - Rate limit
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Rate Limiting (10분에 3회)
    const ip = extractIpAddress(request);
    const rateLimitKey = generateRateLimitKey(ip, 'passwordReset');
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_RULES.passwordReset
    );

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
    const validationResult = resetConfirmSchema.safeParse(body);

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

    const data: ResetConfirmData = validationResult.data;

    // 4. Password Match Validation
    if (data.password !== data.password_confirm) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PASSWORD_MISMATCH',
            message: '비밀번호가 일치하지 않습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 5. Password Strength Validation
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: passwordValidation.errors[0],
            details: {
              errors: passwordValidation.errors,
              suggestions: passwordValidation.suggestions,
            },
          },
        },
        { status: 400 }
      );
    }

    // 6. Supabase Client Connection (Mock - Phase 1)
    const supabase = await createClient();
    console.log('[Phase 1 Mock] Supabase client connected:', !!supabase);
    console.log('[Phase 1 Mock] Password update confirmed for:', data.email?.substring(0, 3) + '***@***');

    // 7. Mock: Update Password (Phase 1)
    // Phase 3 will use: supabase.auth.updateUser({ password: newPassword })

    // 8. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: '비밀번호가 성공적으로 변경되었습니다. (Phase 1 Mock with Supabase)',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[비밀번호 재설정 확인 API] 오류:', error);

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
// OPTIONS /api/auth/reset-password
// ============================================================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
