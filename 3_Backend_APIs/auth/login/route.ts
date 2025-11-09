/**
 * P1BA2: Login API
 * 작업일: 2025-11-03
 * 설명: 로그인 API 엔드포인트
 * POST /api/auth/login
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createErrorResponse,
  supabaseClient,
  ERROR_CODES,
} from '@/infrastructure/core';
import { errorHandler, Logger } from '@/infrastructure/error-handling';

/**
 * 로그인 요청 스키마
 */
const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * POST /api/auth/login
 */
async function handler(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    // 요청 메서드 검증
    if (req.method !== 'POST') {
      return createErrorResponse(
        ERROR_CODES.INVALID_REQUEST,
        'Method not allowed',
        405
      );
    }

    // 요청 바디 파싱
    const body = await req.json();

    // 데이터 검증
    let data: LoginRequest;
    try {
      data = LoginRequestSchema.parse(body);
    } catch (error) {
      const validationError = error as z.ZodError;
      logger.warn('Login validation failed', {
        errors: validationError.errors,
      });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400
      );
    }

    // Supabase 인증
    const { data: authData, error: authError } =
      await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError || !authData.user) {
      logger.warn('Login failed', {
        email: data.email,
        error: authError?.message,
      });

      // 보안: 구체적인 에러 정보를 노출하지 않음
      return createErrorResponse(
        ERROR_CODES.AUTH_FAILED,
        'Invalid email or password',
        401
      );
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Profile lookup failed', profileError as Error, {
        userId: authData.user.id,
      });
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load user profile',
        500
      );
    }

    // 세션 토큰 저장 (선택사항: remember_me)
    if (data.remember_me && authData.session) {
      const { error: tokenError } = await supabaseClient
        .from('auth_tokens')
        .insert({
          user_id: authData.user.id,
          token_type: 'refresh',
          token_value: authData.session.refresh_token || '',
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

      if (tokenError) {
        logger.warn('Failed to store refresh token', {
          userId: authData.user.id,
        });
      }
    }

    logger.info('Login successful', {
      userId: authData.user.id,
      email: data.email,
    });

    // 성공 응답
    return createSuccessResponse(
      {
        user_id: authData.user.id,
        email: profile.email,
        nickname: profile.nickname,
        full_name: profile.full_name,
        influence_grade: profile.influence_grade,
        score: profile.score,
        is_verified: profile.is_verified,
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      },
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in login handler', error as Error);

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * Export wrapped handler with error handling
 */
export const POST = errorHandler(handler);

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
