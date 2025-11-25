/**
 * Project Grid Task ID: P4BA13
 * 작업명: 관리자 액션 로그 API - API Routes
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P4BA8 (감사 로그 API), P2D1 (Database 스키마)
 * 설명: 관리자 액션 로그 조회 및 기록 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getActivityTracker, AdminActionType } from '@/lib/admin/activity-tracker';

/**
 * GET 쿼리 파라미터 검증 스키마
 */
const getActionLogsQuerySchema = z.object({
  adminId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  result: z.enum(['success', 'failure']).optional(),
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
});

/**
 * POST 요청 바디 검증 스키마
 */
const trackActionSchema = z.object({
  actionType: z.string().min(1, 'actionType은 필수입니다'),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
  result: z.enum(['success', 'failure']).optional().default('success'),
  durationMs: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * 관리자 권한 확인 함수
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
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
 * GET /api/admin/action-logs
 * 관리자 액션 로그 조회 (관리자 전용)
 *
 * Query Parameters:
 * - adminId?: string (UUID)
 * - actionType?: string
 * - result?: 'success' | 'failure'
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: string (default: 'created_at')
 * - sortOrder?: 'asc' | 'desc' (default: 'desc')
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
      result: (searchParams.get('result') as 'success' | 'failure') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const validated = getActionLogsQuerySchema.parse(queryParams);

    // 4. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 5. 카운트 쿼리 (필터 적용)
    let countQuery = supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true });

    // 필터 적용
    if (validated.adminId) {
      countQuery = countQuery.eq('admin_id', validated.adminId);
    }
    if (validated.actionType) {
      countQuery = countQuery.eq('action_type', validated.actionType);
    }
    if (validated.result) {
      countQuery = countQuery.eq('result', validated.result);
    }
    if (validated.startDate) {
      countQuery = countQuery.gte('created_at', validated.startDate);
    }
    if (validated.endDate) {
      countQuery = countQuery.lte('created_at', validated.endDate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('[GET /api/admin/action-logs] Count query error:', countError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '액션 로그 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    const total = count || 0;

    // 6. 데이터 쿼리 (필터 + 정렬 + 페이지네이션)
    let dataQuery = supabase.from('admin_actions').select('*');

    // 필터 적용
    if (validated.adminId) {
      dataQuery = dataQuery.eq('admin_id', validated.adminId);
    }
    if (validated.actionType) {
      dataQuery = dataQuery.eq('action_type', validated.actionType);
    }
    if (validated.result) {
      dataQuery = dataQuery.eq('result', validated.result);
    }
    if (validated.startDate) {
      dataQuery = dataQuery.gte('created_at', validated.startDate);
    }
    if (validated.endDate) {
      dataQuery = dataQuery.lte('created_at', validated.endDate);
    }

    // 정렬
    const ascending = validated.sortOrder === 'asc';
    dataQuery = dataQuery.order(validated.sortBy, { ascending });

    // 페이지네이션
    const start = (validated.page - 1) * validated.limit;
    const end = start + validated.limit - 1;
    dataQuery = dataQuery.range(start, end);

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error('[GET /api/admin/action-logs] Data query error:', dataError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '액션 로그 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil(total / validated.limit);

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages,
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

    console.error('[GET /api/admin/action-logs] Unexpected error:', error);
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
 * POST /api/admin/action-logs
 * 관리자 액션 추적 기록 (관리자 전용)
 *
 * Body:
 * - actionType: string (required)
 * - targetType?: string
 * - targetId?: string (UUID)
 * - result?: 'success' | 'failure' (default: 'success')
 * - durationMs?: number
 * - metadata?: object
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
    const validated = trackActionSchema.parse(body);

    // 4. 액션 추적
    const tracker = getActivityTracker();
    const actionRecord = await tracker.track({
      adminId: user.id,
      actionType: validated.actionType,
      targetType: validated.targetType,
      targetId: validated.targetId,
      result: validated.result,
      durationMs: validated.durationMs,
      metadata: validated.metadata,
    });

    if (!actionRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRACKING_ERROR',
            message: '액션 추적 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: actionRecord,
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

    console.error('[POST /api/admin/action-logs] Unexpected error:', error);
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
 * OPTIONS /api/admin/action-logs
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
