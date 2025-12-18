// P7BA4: 자동화 로그 조회 API (관리자용)
// GET /api/admin/automation - 자동화 로그 조회
// GET /api/admin/automation?type=statistics - 통계 조회
// GET /api/admin/automation?type=backups - 백업 이력 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 유형에 따라 다른 데이터 조회
    switch (type) {
      case 'statistics': {
        // 일일 통계 조회
        const { data: stats, error, count } = await supabase
          .from('daily_statistics')
          .select('*', { count: 'exact' })
          .order('date', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('[admin/automation] Statistics error:', error);
          return NextResponse.json({
            success: false,
            error: { code: 'DATABASE_ERROR', message: '통계 조회 중 오류가 발생했습니다.' }
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          type: 'statistics',
          data: stats,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        });
      }

      case 'backups': {
        // 백업 이력 조회
        const { data: backups, error, count } = await supabase
          .from('backup_history')
          .select('*', { count: 'exact' })
          .order('started_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('[admin/automation] Backups error:', error);
          return NextResponse.json({
            success: false,
            error: { code: 'DATABASE_ERROR', message: '백업 이력 조회 중 오류가 발생했습니다.' }
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          type: 'backups',
          data: backups,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        });
      }

      case 'news': {
        // 크롤링된 뉴스 조회
        const politicianId = searchParams.get('politician_id');

        let query = supabase
          .from('crawled_news')
          .select('*, politicians(name)', { count: 'exact' })
          .order('crawled_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (politicianId) {
          query = query.eq('politician_id', politicianId);
        }

        const { data: news, error, count } = await query;

        if (error) {
          console.error('[admin/automation] News error:', error);
          return NextResponse.json({
            success: false,
            error: { code: 'DATABASE_ERROR', message: '뉴스 조회 중 오류가 발생했습니다.' }
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          type: 'news',
          data: news,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        });
      }

      default: {
        // 자동화 로그 조회
        const jobType = searchParams.get('job_type');
        const status = searchParams.get('status');

        let query = supabase
          .from('automation_logs')
          .select('*', { count: 'exact' })
          .order('started_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (jobType) {
          query = query.eq('job_type', jobType);
        }
        if (status) {
          query = query.eq('status', status);
        }

        const { data: logs, error, count } = await query;

        if (error) {
          console.error('[admin/automation] Logs error:', error);
          return NextResponse.json({
            success: false,
            error: { code: 'DATABASE_ERROR', message: '로그 조회 중 오류가 발생했습니다.' }
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          type: 'logs',
          data: logs,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        });
      }
    }

  } catch (error: any) {
    console.error('[admin/automation] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}

// 수동 작업 트리거 API
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' }
      }, { status: 403 });
    }

    const body = await request.json();
    const { job_type } = body;

    if (!job_type) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'job_type이 필요합니다.' }
      }, { status: 400 });
    }

    // 수동 실행할 Cron 엔드포인트 매핑
    const cronEndpoints: Record<string, string> = {
      statistics: '/api/cron/generate-statistics',
      cleanup: '/api/cron/cleanup',
      backup: '/api/cron/backup',
      news_crawl: '/api/cron/crawl-news',
    };

    const endpoint = cronEndpoints[job_type];
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_JOB_TYPE', message: '유효하지 않은 작업 유형입니다.' }
      }, { status: 400 });
    }

    // 내부 API 호출
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    const cronResponse = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    });

    const result = await cronResponse.json();

    return NextResponse.json({
      success: result.success,
      message: result.message || '작업이 트리거되었습니다.',
      data: result.data,
    });

  } catch (error: any) {
    console.error('[admin/automation] Trigger error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
