/**
 * Project Grid Task ID: P4BA13
 * 작업명: 관리자 액션 로그 API - Statistics Routes
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P4BA8 (감사 로그 API), P2D1 (Database 스키마)
 * 설명: 관리자 액션 통계 조회 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getActivityTracker } from '@/lib/admin/activity-tracker';

/**
 * GET 쿼리 파라미터 검증 스키마
 */
const getStatsQuerySchema = z.object({
  adminId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['admin', 'action_type', 'date']).default('action_type'),
});

/**
 * 관리자 권한 확인 함수
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data: profile, error } = await supabase
      .from('users')
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
 * GET /api/admin/action-logs/stats
 * 관리자 액션 통계 조회 (관리자 전용)
 *
 * Query Parameters:
 * - adminId?: string (UUID) - 특정 관리자 필터링
 * - startDate?: string (ISO 8601) - 시작 날짜
 * - endDate?: string (ISO 8601) - 종료 날짜
 * - groupBy: 'admin' | 'action_type' | 'date' (default: 'action_type')
 *
 * Response:
 * {
 *   totalActions: number,
 *   byAdmin?: [{ adminId, name, count }],
 *   byActionType?: [{ type, count }],
 *   byDate?: [{ date, count }],
 *   byResult?: { success, failure },
 *   avgDuration?: number
 * }
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
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: (searchParams.get('groupBy') as 'admin' | 'action_type' | 'date') || 'action_type',
    };

    const validated = getStatsQuerySchema.parse(queryParams);

    // 4. 통계 조회
    const tracker = getActivityTracker();
    const stats = await tracker.getStatistics({
      adminId: validated.adminId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      groupBy: validated.groupBy,
    });

    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '통계 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: stats,
        filters: {
          adminId: validated.adminId,
          startDate: validated.startDate,
          endDate: validated.endDate,
          groupBy: validated.groupBy,
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

    console.error('[GET /api/admin/action-logs/stats] Unexpected error:', error);
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
 * POST /api/admin/action-logs/stats
 * 커스텀 통계 조회 (복잡한 필터 지원)
 *
 * Body:
 * - adminIds?: string[] - 여러 관리자 필터링
 * - actionTypes?: string[] - 여러 액션 타입 필터링
 * - startDate?: string
 * - endDate?: string
 * - groupBy: 'admin' | 'action_type' | 'date'
 * - includeFailures?: boolean - 실패한 액션 포함 여부
 */
const customStatsSchema = z.object({
  adminIds: z.array(z.string().uuid()).optional(),
  actionTypes: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['admin', 'action_type', 'date']).default('action_type'),
  includeFailures: z.boolean().optional().default(true),
});

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
    const validated = customStatsSchema.parse(body);

    // 4. Supabase 클라이언트 생성
    const supabase = createClient();

    // 5. 복잡한 필터 쿼리 구성
    let query = supabase.from('admin_actions').select('*');

    // 여러 관리자 필터
    if (validated.adminIds && validated.adminIds.length > 0) {
      query = query.in('admin_id', validated.adminIds);
    }

    // 여러 액션 타입 필터
    if (validated.actionTypes && validated.actionTypes.length > 0) {
      query = query.in('action_type', validated.actionTypes);
    }

    // 날짜 범위 필터
    if (validated.startDate) {
      query = query.gte('created_at', validated.startDate);
    }
    if (validated.endDate) {
      query = query.lte('created_at', validated.endDate);
    }

    // 실패 액션 제외
    if (!validated.includeFailures) {
      query = query.eq('result', 'success');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[POST /api/admin/action-logs/stats] Query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '통계 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            totalActions: 0,
            byAdmin: [],
            byActionType: [],
            byDate: [],
            byResult: { success: 0, failure: 0 },
            avgDuration: 0,
          },
          filters: validated,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 6. 통계 계산
    const stats = {
      totalActions: data.length,
      byAdmin: [] as any[],
      byActionType: [] as any[],
      byDate: [] as any[],
      byResult: { success: 0, failure: 0 },
      avgDuration: 0,
    };

    // 그룹별 집계
    if (validated.groupBy === 'admin') {
      const adminCounts: Record<string, number> = {};
      data.forEach((action: any) => {
        const adminId = action.admin_id;
        adminCounts[adminId] = (adminCounts[adminId] || 0) + 1;
      });

      for (const [adminId, count] of Object.entries(adminCounts)) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', adminId)
          .single();

        stats.byAdmin.push({
          adminId,
          name: profile?.full_name || profile?.email || 'Unknown',
          count,
        });
      }
      stats.byAdmin.sort((a, b) => b.count - a.count);
    } else if (validated.groupBy === 'action_type') {
      const typeCounts: Record<string, number> = {};
      data.forEach((action: any) => {
        const type = action.action_type;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      stats.byActionType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    } else if (validated.groupBy === 'date') {
      const dateCounts: Record<string, number> = {};
      data.forEach((action: any) => {
        const date = new Date(action.created_at).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });

      stats.byDate = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // 결과별 집계
    data.forEach((action: any) => {
      if (action.result === 'success') {
        stats.byResult.success++;
      } else if (action.result === 'failure') {
        stats.byResult.failure++;
      }
    });

    // 평균 실행 시간
    const durations = data
      .filter((action: any) => action.duration_ms != null)
      .map((action: any) => action.duration_ms);

    if (durations.length > 0) {
      const sum = durations.reduce((acc: number, val: number) => acc + val, 0);
      stats.avgDuration = Math.round(sum / durations.length);
    }

    return NextResponse.json(
      {
        success: true,
        data: stats,
        filters: validated,
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
            message: '요청 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/admin/action-logs/stats] Unexpected error:', error);
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
 * OPTIONS /api/admin/action-logs/stats
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
