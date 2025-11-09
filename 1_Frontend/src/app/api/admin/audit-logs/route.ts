/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - API Routes
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1 (Database 스키마)
 * 설명: 감사 로그 조회 및 기록 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getAuditLogger, AuditActionType } from '@/lib/audit/logger';
import { createAuditLogQueryBuilder, AuditLogFilters } from '@/lib/audit/query-builder';

/**
 * GET 쿼리 파라미터 검증 스키마
 */
const getAuditLogsQuerySchema = z.object({
  adminId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  targetType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, 'limit은 1-100 사이여야 합니다'),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

/**
 * POST 요청 바디 검증 스키마
 */
const createAuditLogSchema = z.object({
  actionType: z.string().min(1, 'actionType은 필수입니다'),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
  details: z.record(z.any()).optional(),
});

/**
 * 관리자 권한 확인 함수
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    // 관리자 또는 슈퍼관리자 권한 확인
    return profile.role === 'admin' || profile.role === 'super_admin';
  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return false;
  }
}

/**
 * GET /api/admin/audit-logs
 * 감사 로그 조회 (관리자 전용)
 *
 * Query Parameters:
 * - adminId?: string (UUID)
 * - actionType?: string
 * - targetType?: string
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: string (default: 'created_at')
 * - sortOrder?: 'asc' | 'desc' (default: 'desc')
 * - format?: 'json' | 'csv' (default: 'json')
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. 관리자 권한 확인
    const isAdmin = await checkAdminRole(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
          },
        },
        { status: 403 }
      );
    }

    // 3. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      adminId: searchParams.get('adminId') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      targetType: searchParams.get('targetType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      format: (searchParams.get('format') as 'json' | 'csv') || 'json',
    };

    const validated = getAuditLogsQuerySchema.parse(queryParams);

    // 4. Supabase 클라이언트 생성
    const supabase = createClient();

    // 5. 필터 옵션 구성
    const filters: AuditLogFilters = {
      adminId: validated.adminId,
      actionType: validated.actionType,
      targetType: validated.targetType,
      startDate: validated.startDate,
      endDate: validated.endDate,
      page: validated.page,
      limit: validated.limit,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    };

    // 6. 쿼리 빌더 생성 및 실행
    const queryBuilder = createAuditLogQueryBuilder(supabase, filters);

    // 7. CSV 내보내기 요청 처리
    if (validated.format === 'csv') {
      const csv = await queryBuilder.exportToCSV();

      if (csv === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EXPORT_ERROR',
              message: 'CSV 내보내기 중 오류가 발생했습니다.',
            },
          },
          { status: 500 }
        );
      }

      // CSV 파일 다운로드 응답
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
        },
      });
    }

    // 8. JSON 응답 처리
    const result = await queryBuilder.execute();

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '감사 로그 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
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
            message: '쿼리 파라미터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[GET /api/admin/audit-logs] Unexpected error:', error);
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

/**
 * POST /api/admin/audit-logs
 * 감사 로그 기록 (관리자 전용)
 *
 * Body:
 * - actionType: string (required)
 * - targetType?: string
 * - targetId?: string (UUID)
 * - details?: object
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. 관리자 권한 확인
    const isAdmin = await checkAdminRole(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
          },
        },
        { status: 403 }
      );
    }

    // 3. 요청 바디 검증
    const body = await request.json();
    const validated = createAuditLogSchema.parse(body);

    // 4. IP 주소 및 User Agent 추출
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 5. 감사 로그 기록
    const auditLogger = getAuditLogger();
    const logRecord = await auditLogger.log({
      adminId: user.id,
      actionType: validated.actionType,
      targetType: validated.targetType,
      targetId: validated.targetId,
      details: validated.details,
      ipAddress,
      userAgent,
    });

    if (!logRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_ERROR',
            message: '감사 로그 기록 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: logRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/admin/audit-logs] Unexpected error:', error);
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

/**
 * OPTIONS /api/admin/audit-logs
 * CORS preflight 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
