// P7BA4: 데이터 백업 Cron API
// GET /api/cron/backup
// 주요 테이블 데이터를 JSON으로 백업하여 Storage에 저장

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

// 백업 대상 테이블 (중요 데이터 위주)
const BACKUP_TABLES = [
  'users',
  'politicians',
  'politician_details',
  'ai_evaluations',
  'politician_ratings',
  'posts',
  'comments',
  'favorite_politicians',
  'report_purchases',
];

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
    const backupDate = new Date().toISOString().split('T')[0];
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 백업 이력 시작
    const { data: backupEntry } = await ((supabase.from('backup_history') as any)
      .insert({
        backup_type: 'full',
        tables_backed_up: BACKUP_TABLES,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single());

    const backupId = backupEntry?.id;

    // 자동화 로그 시작
    const { data: logEntry } = await ((supabase.from('automation_logs') as any)
      .insert({
        job_type: 'backup',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { backup_id: backupId },
      })
      .select('id')
      .single());

    const logId = logEntry?.id;

    try {
      const backupResults: Record<string, { rows: number; size: number }> = {};
      let totalSize = 0;
      let totalRows = 0;

      // 각 테이블 백업
      for (const tableName of BACKUP_TABLES) {
        try {
          // 테이블 데이터 조회
          const { data, error } = await (supabase
            .from(tableName)
            .select('*')
            .limit(100000) as any);  // 안전을 위해 최대 10만 건

          if (error) {
            console.warn(`[backup] Table ${tableName} error:`, error.message);
            backupResults[tableName] = { rows: 0, size: 0 };
            continue;
          }

          const jsonData = JSON.stringify(data || [], null, 2);
          const dataSize = new TextEncoder().encode(jsonData).length;

          // Supabase Storage에 백업 저장
          const fileName = `backups/${backupDate}/${tableName}_${backupTimestamp}.json`;

          const { error: uploadError } = await supabase.storage
            .from('backups')
            .upload(fileName, jsonData, {
              contentType: 'application/json',
              upsert: true,
            });

          if (uploadError) {
            console.warn(`[backup] Upload ${tableName} error:`, uploadError.message);
          }

          backupResults[tableName] = {
            rows: data?.length || 0,
            size: dataSize,
          };

          totalRows += data?.length || 0;
          totalSize += dataSize;

        } catch (tableError: any) {
          console.error(`[backup] Error backing up ${tableName}:`, tableError.message);
          backupResults[tableName] = { rows: 0, size: 0 };
        }
      }

      const duration = Date.now() - startTime;

      // 백업 이력 업데이트 (성공)
      if (backupId) {
        await (supabase.from('backup_history') as any)
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            file_size_bytes: totalSize,
            metadata: {
              results: backupResults,
              total_rows: totalRows,
              duration_ms: duration,
            },
          })
          .eq('id', backupId);
      }

      // 자동화 로그 업데이트 (성공)
      if (logId) {
        await (supabase.from('automation_logs') as any)
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            records_processed: totalRows,
            metadata: {
              backup_id: backupId,
              tables: Object.keys(backupResults).length,
              total_size_bytes: totalSize,
            },
          })
          .eq('id', logId);
      }

      return NextResponse.json({
        success: true,
        message: '데이터 백업이 완료되었습니다.',
        data: {
          backup_id: backupId,
          backup_date: backupDate,
          tables: backupResults,
          total_rows: totalRows,
          total_size_bytes: totalSize,
          total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
          duration_ms: duration,
        },
      });

    } catch (innerError: any) {
      // 백업 이력 업데이트 (실패)
      if (backupId) {
        await (supabase.from('backup_history') as any)
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: innerError.message,
          })
          .eq('id', backupId);
      }

      // 자동화 로그 업데이트 (실패)
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
    console.error('[backup] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'BACKUP_ERROR',
        message: '백업 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;  // 5분 (큰 데이터셋 고려)
