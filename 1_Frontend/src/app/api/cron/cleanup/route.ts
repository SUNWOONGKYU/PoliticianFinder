// P7BA4: 오래된 데이터 정리 Cron API
// GET /api/cron/cleanup
// 주 1회 실행 권장 (매주 일요일 새벽 등)

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Vercel Cron 인증 확인
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  return process.env.NODE_ENV === 'development';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' }
      }, { status: 401 });
    }

    const supabase = createAdminClient();

    // URL에서 보관 기간 파라미터 읽기 (기본 90일)
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('days') || '90');

    // 자동화 로그 시작
    const { data: logEntry } = await ((supabase.from('automation_logs') as any)
      .insert({
        job_type: 'cleanup',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { days_to_keep: daysToKeep },
      })
      .select('id')
      .single());

    const logId = logEntry?.id;

    try {
      // 정리 작업 수행
      const cleanupResults: any = {
        notifications: 0,
        automation_logs: 0,
        old_news: 0,
      };

      // 1. 오래된 읽은 알림 삭제 (읽은 알림만)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISOString = cutoffDate.toISOString();

      const { count: notifCount } = await (supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .eq('is_read', true)
        .lt('created_at', cutoffISOString) as any);

      cleanupResults.notifications = notifCount || 0;

      // 2. 오래된 자동화 로그 삭제
      const { count: logCount } = await (supabase
        .from('automation_logs')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffISOString)
        .neq('id', logId) as any);  // 현재 로그는 제외

      cleanupResults.automation_logs = logCount || 0;

      // 3. 오래된 비활성 뉴스 삭제
      const { count: newsCount } = await (supabase
        .from('crawled_news')
        .delete({ count: 'exact' })
        .eq('is_active', false)
        .lt('created_at', cutoffISOString) as any);

      cleanupResults.old_news = newsCount || 0;

      // 4. 오래된 백업 이력 정리 (180일 이상)
      const backupCutoff = new Date();
      backupCutoff.setDate(backupCutoff.getDate() - 180);

      const { count: backupCount } = await (supabase
        .from('backup_history')
        .delete({ count: 'exact' })
        .lt('created_at', backupCutoff.toISOString()) as any);

      cleanupResults.backup_history = backupCount || 0;

      const totalDeleted = Object.values(cleanupResults).reduce((a: number, b: any) => a + b, 0);
      const duration = Date.now() - startTime;

      // 로그 업데이트 (성공)
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            records_processed: totalDeleted,
            metadata: {
              days_to_keep: daysToKeep,
              cutoff_date: cutoffISOString,
              results: cleanupResults,
            },
          })
          .eq('id', logId);
      }

      return NextResponse.json({
        success: true,
        message: '데이터 정리가 완료되었습니다.',
        data: {
          days_to_keep: daysToKeep,
          cutoff_date: cutoffISOString,
          deleted: cleanupResults,
          total_deleted: totalDeleted,
          duration_ms: duration,
        },
      });

    } catch (innerError: any) {
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
    console.error('[cleanup] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: '데이터 정리 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
