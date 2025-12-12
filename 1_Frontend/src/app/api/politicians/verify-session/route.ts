// 정치인 세션 토큰 검증 API
// POST /api/politicians/verify-session

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validatePoliticianSession } from '@/lib/auth/politicianSession';

const verifySessionSchema = z.object({
  politician_id: z.string().min(8).max(8, 'politician_id는 8자리 hex 문자열이어야 합니다'),
  session_token: z.string().min(64).max(64, 'session_token은 64자리 hex 문자열이어야 합니다'),
});

/**
 * POST /api/politicians/verify-session
 * 정치인 세션 토큰 검증
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증
    const validated = verifySessionSchema.parse(body);

    // 세션 토큰 검증
    const result = await validatePoliticianSession(
      validated.politician_id,
      validated.session_token
    );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.error?.code === 'NOT_FOUND' ? 404 : 401 }
      );
    }

    // 검증 성공
    return NextResponse.json(
      {
        success: true,
        politician: result.politician,
        message: `${result.politician?.name}님 인증 성공`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/politicians/verify-session] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
