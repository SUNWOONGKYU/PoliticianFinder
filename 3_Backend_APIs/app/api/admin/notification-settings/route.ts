/**
 * P4BA11: 알림 설정 API
 * 작업일: 2025-11-09
 * 설명: 전역 알림 설정 관리 API
 * GET /api/admin/notification-settings - 전역 설정 조회
 * PATCH /api/admin/notification-settings - 전역 설정 수정
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createErrorResponse,
  supabaseClient,
  ERROR_CODES,
  verifyAuthToken,
} from '@/infrastructure/core';
import { errorHandler, Logger } from '@/infrastructure/error-handling';

/**
 * 알림 설정 스키마
 */
const NotificationSettingsSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  batch_processing_enabled: z.boolean().optional(),
  batch_interval_minutes: z.number().min(1).max(1440).optional(), // 1분 ~ 24시간
  max_notifications_per_user: z.number().min(1).max(100).optional(),
  rate_limit_per_minute: z.number().min(1).max(1000).optional(),
  email_notifications_enabled: z.boolean().optional(),
  push_notifications_enabled: z.boolean().optional(),
});

type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

/**
 * 알림 설정 응답 인터페이스
 */
interface NotificationSettingsResponse {
  id: string;
  notifications_enabled: boolean;
  batch_processing_enabled: boolean;
  batch_interval_minutes: number;
  max_notifications_per_user: number;
  rate_limit_per_minute: number;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * GET /api/admin/notification-settings
 * 전역 알림 설정 조회
 */
async function handleGet(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    // 인증 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Authorization header missing',
        401
      );
    }

    const authResult = await verifyAuthToken(authHeader);
    if (!authResult.valid) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        authResult.error || 'Invalid token',
        401
      );
    }

    // 관리자 권한 확인
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', authResult.userId)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      logger.warn('Non-admin user attempted to access notification settings', {
        userId: authResult.userId,
      });
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Admin access required',
        403
      );
    }

    // 설정 조회 (전역 설정은 단일 레코드)
    const { data: settings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .single();

    if (settingsError) {
      logger.error('Failed to fetch notification settings', settingsError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to fetch notification settings',
        500
      );
    }

    logger.info('Notification settings fetched', {
      userId: authResult.userId,
    });

    return createSuccessResponse<NotificationSettingsResponse>(settings, 200);
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in GET notification settings', error as Error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * PATCH /api/admin/notification-settings
 * 전역 알림 설정 수정
 */
async function handlePatch(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    // 인증 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Authorization header missing',
        401
      );
    }

    const authResult = await verifyAuthToken(authHeader);
    if (!authResult.valid) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        authResult.error || 'Invalid token',
        401
      );
    }

    // 관리자 권한 확인
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', authResult.userId)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      logger.warn('Non-admin user attempted to update notification settings', {
        userId: authResult.userId,
      });
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Admin access required',
        403
      );
    }

    // 요청 바디 파싱
    const body = await req.json();

    // 데이터 검증
    let updateData: NotificationSettings;
    try {
      updateData = NotificationSettingsSchema.parse(body);
    } catch (error) {
      const validationError = error as z.ZodError;
      logger.warn('Notification settings validation failed', {
        errors: validationError.errors,
      });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400,
        JSON.stringify(validationError.errors)
      );
    }

    // 최소한 하나의 필드는 업데이트되어야 함
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'At least one field must be provided',
        400
      );
    }

    // 설정 업데이트
    const { data: updatedSettings, error: updateError } = await supabaseClient
      .from('notification_settings')
      .update({
        ...updateData,
        updated_by: authResult.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001') // 전역 설정은 고정 ID 사용
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update notification settings', updateError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update notification settings',
        500
      );
    }

    logger.info('Notification settings updated', {
      userId: authResult.userId,
      changes: updateData,
    });

    return createSuccessResponse<NotificationSettingsResponse>(
      updatedSettings,
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in PATCH notification settings', error as Error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * Route handler - method routing
 */
async function handler(req: NextRequest) {
  switch (req.method) {
    case 'GET':
      return handleGet(req);
    case 'PATCH':
      return handlePatch(req);
    default:
      return createErrorResponse(
        ERROR_CODES.INVALID_REQUEST,
        'Method not allowed',
        405
      );
  }
}

/**
 * Export wrapped handlers with error handling
 */
export const GET = errorHandler(handleGet);
export const PATCH = errorHandler(handlePatch);

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
