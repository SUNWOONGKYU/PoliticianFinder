/**
 * P1BA1: Signup API
 * 작업일: 2025-11-03
 * 설명: 회원가입 API 엔드포인트
 * POST /api/auth/signup
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createErrorResponse,
  supabaseClient,
  validatePassword,
  validateEmail,
  ERROR_CODES,
} from '@/infrastructure/core';
import {
  errorHandler,
  Logger,
  ValidationError,
  ConflictError,
} from '@/infrastructure/error-handling';

/**
 * 회원가입 요청 스키마
 */
const SignupRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
  nickname: z.string().min(2).max(50),
  full_name: z.string().optional(),
});

type SignupRequest = z.infer<typeof SignupRequestSchema>;

/**
 * POST /api/auth/signup
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
    let data: SignupRequest;
    try {
      data = SignupRequestSchema.parse(body);
    } catch (error) {
      const validationError = error as z.ZodError;
      logger.warn('Signup validation failed', {
        errors: validationError.errors,
      });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400,
        JSON.stringify(validationError.errors)
      );
    }

    // 이메일 형식 검증
    if (!validateEmail(data.email)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid email format',
        400
      );
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Password does not meet requirements',
        400,
        JSON.stringify(passwordValidation.errors)
      );
    }

    // 비밀번호 일치 검증
    if (data.password !== data.password_confirm) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Passwords do not match',
        400
      );
    }

    // 이메일 중복 체크
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      logger.warn('Duplicate email signup attempt', { email: data.email });
      return createErrorResponse(
        ERROR_CODES.CONFLICT,
        'Email already registered',
        409
      );
    }

    // 닉네임 중복 체크
    const { data: existingNickname } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('nickname', data.nickname)
      .single();

    if (existingNickname) {
      logger.warn('Duplicate nickname signup attempt', {
        nickname: data.nickname,
      });
      return createErrorResponse(
        ERROR_CODES.CONFLICT,
        'Nickname already taken',
        409
      );
    }

    // Supabase 인증 회원가입
    const { data: authData, error: authError } =
      await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

    if (authError || !authData.user) {
      logger.error('Signup authentication failed', authError as Error, {
        email: data.email,
      });
      return createErrorResponse(
        ERROR_CODES.AUTH_FAILED,
        'Failed to create account',
        400,
        authError?.message
      );
    }

    // 프로필 생성
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: data.email,
        nickname: data.nickname,
        full_name: data.full_name || null,
        is_verified: false,
        influence_grade: '방랑자',
        score: 0,
      })
      .select()
      .single();

    if (profileError || !profile) {
      logger.error('Profile creation failed', profileError as Error, {
        userId: authData.user.id,
      });

      // 인증 계정 삭제 (롤백)
      await supabaseClient.auth.admin.deleteUser(authData.user.id);

      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create user profile',
        500
      );
    }

    logger.info('User signup successful', {
      userId: authData.user.id,
      email: data.email,
      nickname: data.nickname,
    });

    // 성공 응답
    return createSuccessResponse(
      {
        user_id: authData.user.id,
        email: profile.email,
        nickname: profile.nickname,
        full_name: profile.full_name,
        message: 'Signup successful. Please verify your email.',
      },
      201
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in signup handler', error as Error);

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
