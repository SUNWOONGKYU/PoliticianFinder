/**
 * P1BA4: Password Reset API
 * 작업일: 2025-11-03
 * 설명: 비밀번호 재설정 API 엔드포인트
 * POST /api/auth/password-reset
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createErrorResponse,
  supabaseClient,
  validateEmail,
  validatePassword,
  ERROR_CODES,
} from '@/infrastructure/core';
import { errorHandler, Logger } from '@/infrastructure/error-handling';
import crypto from 'crypto';

/**
 * 비밀번호 재설정 요청 스키마
 */
const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * 비밀번호 재설정 확인 스키마
 */
const PasswordResetConfirmSchema = z.object({
  reset_token: z.string(),
  password: z.string().min(8),
  password_confirm: z.string(),
});

type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
type PasswordResetConfirm = z.infer<typeof PasswordResetConfirmSchema>;

/**
 * 재설정 토큰 생성
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 이메일 발송 (시뮬레이션)
 */
async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const logger = Logger.getInstance();

  try {
    // TODO: Implement actual email sending using service like SendGrid, AWS SES, etc.
    const resetUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/password-reset?token=${resetToken}`;

    logger.info('Password reset email sent (simulated)', {
      email,
      resetUrl: resetUrl.substring(0, 50) + '...',
    });

    // Simulate email sending
    console.log(`
    ========================================
    Password Reset Email (Simulated)
    ========================================
    To: ${email}

    Click the link below to reset your password:
    ${resetUrl}

    This link will expire in 1 hour.
    ========================================
    `);

    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', error as Error, {
      email,
    });
    return false;
  }
}

/**
 * POST /api/auth/password-reset (단계 1: 이메일 입력)
 */
async function handleInitiate(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    const body = await req.json();

    // 데이터 검증
    let data: PasswordResetRequest;
    try {
      data = PasswordResetRequestSchema.parse(body);
    } catch (error) {
      const validationError = error as z.ZodError;
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400
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

    // 사용자 존재 여부 확인
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', data.email)
      .single();

    if (userError || !user) {
      // 보안: 존재하지 않는 이메일이어도 성공 메시지 반환
      logger.info('Password reset requested for non-existent email', {
        email: data.email,
      });
      return createSuccessResponse(
        {
          message: 'If the email exists, a password reset link has been sent',
        },
        200
      );
    }

    // 재설정 토큰 생성
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    // 재설정 토큰 저장
    const { error: tokenError } = await supabaseClient
      .from('password_resets')
      .insert({
        user_id: user.user_id,
        email: data.email,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (tokenError) {
      logger.error('Failed to store password reset token', tokenError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to generate reset link',
        500
      );
    }

    // 이메일 발송
    const emailSent = await sendPasswordResetEmail(data.email, resetToken);

    if (!emailSent) {
      logger.warn('Failed to send password reset email', { email: data.email });
    }

    logger.info('Password reset initiated', { email: data.email });

    return createSuccessResponse(
      {
        message: 'If the email exists, a password reset link has been sent',
      },
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in password reset handler', error as Error);

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * PUT /api/auth/password-reset (단계 2: 새 비밀번호 설정)
 */
async function handleConfirm(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    const body = await req.json();

    // 데이터 검증
    let data: PasswordResetConfirm;
    try {
      data = PasswordResetConfirmSchema.parse(body);
    } catch (error) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400
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

    // 재설정 토큰 검증
    const { data: resetRecord, error: tokenError } = await supabaseClient
      .from('password_resets')
      .select('*')
      .eq('reset_token', data.reset_token)
      .single();

    if (tokenError || !resetRecord) {
      logger.warn('Invalid password reset token', { token: data.reset_token.substring(0, 10) + '...' });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid or expired reset link',
        400
      );
    }

    // 토큰 만료 확인
    if (new Date(resetRecord.expires_at) < new Date()) {
      logger.warn('Password reset token expired', { email: resetRecord.email });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Reset link has expired',
        400
      );
    }

    // 토큰 사용 여부 확인
    if (resetRecord.is_used) {
      logger.warn('Password reset token already used', { email: resetRecord.email });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'This reset link has already been used',
        400
      );
    }

    // 비밀번호 변경
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: data.password }
    );

    if (updateError) {
      logger.error('Failed to update password', updateError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to reset password',
        500
      );
    }

    // 재설정 토큰 사용 표시
    await supabaseClient
      .from('password_resets')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    logger.info('Password reset completed', { email: resetRecord.email });

    return createSuccessResponse(
      {
        message: 'Password has been successfully reset',
      },
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in password reset confirm', error as Error);

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * Handler wrapper
 */
async function handler(req: NextRequest) {
  if (req.method === 'POST') {
    return handleInitiate(req);
  } else if (req.method === 'PUT') {
    return handleConfirm(req);
  } else {
    return createErrorResponse(
      ERROR_CODES.INVALID_REQUEST,
      'Method not allowed',
      405
    );
  }
}

export const POST = errorHandler(handleInitiate);
export const PUT = errorHandler(handleConfirm);

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
