/**
 * P4BA11: 알림 템플릿 API
 * 작업일: 2025-11-09
 * 설명: 알림 템플릿 관리 API
 * GET /api/admin/notification-templates - 템플릿 목록 조회
 * GET /api/admin/notification-templates?type={type} - 특정 템플릿 조회
 * PATCH /api/admin/notification-templates - 템플릿 수정
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
 * 알림 템플릿 타입
 */
export const NotificationTypes = {
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  MENTION: 'mention',
  REPLY: 'reply',
  SYSTEM: 'system',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

/**
 * 템플릿 업데이트 스키마
 */
const TemplateUpdateSchema = z.object({
  type: z.enum(['comment', 'like', 'follow', 'mention', 'reply', 'system']),
  title_template: z.string().min(1).max(200).optional(),
  body_template: z.string().min(1).max(500).optional(),
  is_enabled: z.boolean().optional(),
});

type TemplateUpdate = z.infer<typeof TemplateUpdateSchema>;

/**
 * 템플릿 응답 인터페이스
 */
interface NotificationTemplate {
  id: string;
  type: string;
  title_template: string;
  body_template: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/notification-templates
 * 템플릿 목록 조회 또는 특정 템플릿 조회
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
      logger.warn('Non-admin user attempted to access notification templates', {
        userId: authResult.userId,
      });
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Admin access required',
        403
      );
    }

    // Query parameter 확인
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // 특정 타입 조회
    if (type) {
      const { data: template, error: templateError } = await supabaseClient
        .from('notification_templates')
        .select('*')
        .eq('type', type)
        .single();

      if (templateError || !template) {
        return createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          `Template not found for type: ${type}`,
          404
        );
      }

      logger.info('Notification template fetched', {
        userId: authResult.userId,
        type,
      });

      return createSuccessResponse<NotificationTemplate>(template, 200);
    }

    // 전체 템플릿 목록 조회
    const { data: templates, error: templatesError } = await supabaseClient
      .from('notification_templates')
      .select('*')
      .order('type', { ascending: true });

    if (templatesError) {
      logger.error('Failed to fetch notification templates', templatesError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to fetch notification templates',
        500
      );
    }

    logger.info('Notification templates list fetched', {
      userId: authResult.userId,
      count: templates?.length || 0,
    });

    return createSuccessResponse<{ templates: NotificationTemplate[]; total: number }>(
      {
        templates: templates || [],
        total: templates?.length || 0,
      },
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in GET notification templates', error as Error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * PATCH /api/admin/notification-templates
 * 템플릿 수정
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
      logger.warn('Non-admin user attempted to update notification template', {
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
    let updateData: TemplateUpdate;
    try {
      updateData = TemplateUpdateSchema.parse(body);
    } catch (error) {
      const validationError = error as z.ZodError;
      logger.warn('Template update validation failed', {
        errors: validationError.errors,
      });
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data',
        400,
        JSON.stringify(validationError.errors)
      );
    }

    // type은 필수이지만 업데이트 대상이 아님
    const { type, ...updateFields } = updateData;

    // 최소한 하나의 필드는 업데이트되어야 함
    if (Object.keys(updateFields).length === 0) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'At least one field to update must be provided',
        400
      );
    }

    // 템플릿 존재 확인
    const { data: existingTemplate, error: checkError } = await supabaseClient
      .from('notification_templates')
      .select('id')
      .eq('type', type)
      .single();

    if (checkError || !existingTemplate) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        `Template not found for type: ${type}`,
        404
      );
    }

    // 템플릿 업데이트
    const { data: updatedTemplate, error: updateError } = await supabaseClient
      .from('notification_templates')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq('type', type)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update notification template', updateError as Error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update notification template',
        500
      );
    }

    logger.info('Notification template updated', {
      userId: authResult.userId,
      type,
      changes: updateFields,
    });

    return createSuccessResponse<NotificationTemplate>(updatedTemplate, 200);
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Unexpected error in PATCH notification template', error as Error);
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
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
