// P3BA1: Real API - 회원
/**
 * Project Grid Task ID: P3BA1
 * 작업명: 사용자 계정 삭제 API (Real - Supabase)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1, P1BA1
 * 설명: Supabase Auth 및 users 테이블 실제 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Request Schema (Zod)
// ============================================================================
const deleteAccountSchema = z.object({
  password: z.string().min(1, '비밀번호는 필수 항목입니다.'),
  confirm: z
    .boolean()
    .refine((val) => val === true, '계정 삭제 확인이 필요합니다.'),
});

type DeleteAccountRequest = z.infer<typeof deleteAccountSchema>;

// ============================================================================
// DELETE /api/user/delete
// ============================================================================
/**
 * 사용자 계정 삭제 API (Real - Supabase)
 *
 * @description Phase 3: Supabase Auth 및 users 테이블에서 계정 삭제
 * @route DELETE /api/user/delete
 * @access Private (requires authentication)
 *
 * @param {string} password - 비밀번호 확인
 * @param {boolean} confirm - 삭제 확인
 *
 * @returns {200} { success: true, data: { message } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {401} { success: false, error: { code, message } } - 인증 실패
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Supabase Client Connection
    const supabase = createClient();

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

    // 3. Request Body Parsing
    const body = await request.json();

    // 4. Input Validation (Zod)
    const validationResult = deleteAccountSchema.safeParse(body);

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

    const data: DeleteAccountRequest = validationResult.data;

    // 5. Verify password by attempting re-authentication
    // Note: This is a security measure to ensure the user knows their password
    if (!authUser.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_NOT_FOUND',
            message: '사용자 이메일을 찾을 수 없습니다.',
          },
        },
        { status: 400 }
      );
    }

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: data.password,
    });

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: '비밀번호가 올바르지 않습니다.',
          },
        },
        { status: 401 }
      );
    }

    console.log('[계정 삭제 API] 계정 삭제 시작:', authUser.id);

    // 6. Delete user profile from users table first
    const { error: profileDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', authUser.id);

    if (profileDeleteError) {
      console.error('[계정 삭제 API] users 테이블 삭제 오류:', profileDeleteError);
      // Continue - we'll try to delete the auth user anyway
    }

    // 7. Delete user from Supabase Auth
    // Note: Supabase Admin API is required to delete users
    // For now, we'll use a service role key approach
    // In production, consider using Supabase Edge Functions with service role key

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[계정 삭제 API] Service Role Key 없음');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message:
              '계정 삭제 기능을 사용할 수 없습니다. 관리자에게 문의하세요.',
          },
        },
        { status: 503 }
      );
    }

    // Delete auth user using Admin API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${authUser.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[계정 삭제 API] Auth 사용자 삭제 오류:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_DELETE_FAILED',
            message: '계정 삭제에 실패했습니다. 관리자에게 문의하세요.',
            details: errorData,
          },
        },
        { status: 500 }
      );
    }

    console.log('[계정 삭제 API] 계정 삭제 완료:', authUser.id);

    // 8. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: '계정이 삭제되었습니다.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[계정 삭제 API] 오류:', error);

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
// OPTIONS /api/user/delete
// ============================================================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
