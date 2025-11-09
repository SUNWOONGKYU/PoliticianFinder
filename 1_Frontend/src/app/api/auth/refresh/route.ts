/**
 * Project Grid Task ID: P1BA1 (Part of P1BA1 - 인증 API 통합)
 * 작업명: 토큰 리프레시 API (Mock)
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI1, P1BI2
 * 설명: Mock 토큰 리프레시 - Phase 1용 Mock API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshMockSession } from '@/lib/mock/authStore';

// ============================================================================
// Request Schema (Zod)
// ============================================================================
const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token은 필수 항목입니다.'),
});

type RefreshRequest = z.infer<typeof refreshSchema>;

// ============================================================================
// POST /api/auth/refresh
// ============================================================================
/**
 * 토큰 리프레시 API (Mock)
 *
 * @description Mock 토큰 리프레시 - 새로운 Access Token 발급
 * @route POST /api/auth/refresh
 * @access Public
 *
 * @param {string} refresh_token - Refresh token
 *
 * @returns {200} { success: true, data: { session } }
 * @returns {400} { success: false, error: { code, message, details } }
 * @returns {401} { success: false, error: { code, message } } - 토큰 무효
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Request Body Parsing
    const body = await request.json();

    // 2. Input Validation (Zod)
    const validationResult = refreshSchema.safeParse(body);

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

    const data: RefreshRequest = validationResult.data;

    // 3. Refresh Mock Session
    const newSession = refreshMockSession(data.refresh_token);

    if (!newSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token이 유효하지 않거나 만료되었습니다.',
          },
        },
        { status: 401 }
      );
    }

    // 4. Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          session: {
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
            expires_in: newSession.expires_in,
            expires_at: newSession.expires_at,
          },
          message: '토큰이 갱신되었습니다. (Mock)',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('토큰 리프레시 API 오류:', error);

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
// OPTIONS /api/auth/refresh
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
