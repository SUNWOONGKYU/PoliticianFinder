// P7BA4: 일일 통계 생성 Cron API
// GET /api/cron/generate-statistics
// Vercel Cron 또는 외부 스케줄러에서 호출

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Vercel Cron 인증 확인
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되어 있으면 인증 필요
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // 개발 환경에서는 인증 없이 허용
  return process.env.NODE_ENV === 'development';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Cron 인증 확인
    if (!verifyCronAuth(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' }
      }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 자동화 로그 시작
    const { data: logEntry, error: logError } = await ((supabase.from('automation_logs') as any)
      .insert({
        job_type: 'statistics',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single());

    const logId = logEntry?.id;

    try {
      // 일일 통계 생성 함수 호출
      const { data: statId, error: statError } = await supabase
        .rpc('generate_daily_statistics') as { data: string | null; error: any };

      if (statError) {
        throw new Error(statError.message);
      }

      // 생성된 통계 조회
      const { data: stats, error: fetchError } = await supabase
        .from('daily_statistics')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .single() as { data: any; error: any };

      const duration = Date.now() - startTime;

      // 로그 업데이트 (성공)
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            records_processed: 1,
            metadata: { stat_id: statId, date: stats?.date },
          })
          .eq('id', logId);
      }

      return NextResponse.json({
        success: true,
        message: '일일 통계가 생성되었습니다.',
        data: {
          stat_id: statId,
          date: stats?.date,
          statistics: stats,
          duration_ms: duration,
        },
      });

    } catch (innerError: any) {
      // 로그 업데이트 (실패)
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error_message: innerError.message,
          })
          .eq('id', logId);
      }
      throw innerError;
    }

  } catch (error: any) {
    console.error('[generate-statistics] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'STATISTICS_ERROR',
        message: '통계 생성 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 });
  }
}

// Vercel Cron 설정용
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
