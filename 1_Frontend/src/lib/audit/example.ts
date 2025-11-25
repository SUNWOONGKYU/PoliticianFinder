/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - Usage Examples
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 설명: Audit Log System 사용 예제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogger, AuditActionType } from './logger';
import { createAuditLogQueryBuilder, AuditLogQueryBuilder } from './query-builder';

/**
 * Example 1: Log a user ban action
 * 사용자 차단 액션 기록
 */
export async function example1_LogUserBan(
  request: NextRequest,
  adminId: string,
  userId: string,
  reason: string
) {
  const logger = getAuditLogger();

  // Extract IP and User Agent from request
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log the ban action
  const logRecord = await logger.logUserBan(
    adminId,
    userId,
    reason,
    ipAddress,
    userAgent
  );

  if (logRecord) {
    console.log('✅ User ban logged:', logRecord.id);
  }
}

/**
 * Example 2: Log a post deletion
 * 게시글 삭제 액션 기록
 */
export async function example2_LogPostDelete(
  adminId: string,
  postId: string,
  reason: string
) {
  const logger = getAuditLogger();

  const logRecord = await logger.logPostDelete(
    adminId,
    postId,
    reason
  );

  return logRecord;
}

/**
 * Example 3: Log a system setting change
 * 시스템 설정 변경 기록
 */
export async function example3_LogSystemSetting(
  adminId: string,
  settingKey: string,
  oldValue: any,
  newValue: any
) {
  const logger = getAuditLogger();

  const logRecord = await logger.logSystemSetting(
    adminId,
    settingKey,
    oldValue,
    newValue
  );

  console.log(`Setting changed: ${settingKey}`);
  console.log(`Old: ${oldValue} → New: ${newValue}`);

  return logRecord;
}

/**
 * Example 4: Log a generic admin action
 * 일반 관리자 액션 기록 (커스텀)
 */
export async function example4_LogCustomAction(
  adminId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  details: Record<string, any>
) {
  const logger = getAuditLogger();

  const logRecord = await logger.log({
    adminId,
    actionType,
    targetType,
    targetId,
    details,
  });

  return logRecord;
}

/**
 * Example 5: Query recent logs
 * 최근 로그 조회
 */
export async function example5_GetRecentLogs() {
  const supabase = await createClient();

  // Get last 50 logs
  const recentLogs = await AuditLogQueryBuilder.getRecentLogs(supabase, 50);

  console.log(`Found ${recentLogs.length} recent logs`);

  // Display each log
  recentLogs.forEach(log => {
    console.log(`[${log.created_at}] ${log.action_type} by ${log.admin_id}`);
  });

  return recentLogs;
}

/**
 * Example 6: Query logs by admin
 * 특정 관리자의 로그 조회
 */
export async function example6_GetLogsByAdmin(adminId: string) {
  const supabase = await createClient();

  // Get last 100 logs for this admin
  const logs = await AuditLogQueryBuilder.getLogsByAdmin(supabase, adminId, 100);

  console.log(`Admin ${adminId} has ${logs.length} logged actions`);

  return logs;
}

/**
 * Example 7: Query logs by target
 * 특정 대상(예: 게시글)의 모든 관리 로그 조회
 */
export async function example7_GetLogsByTarget(
  targetType: string,
  targetId: string
) {
  const supabase = await createClient();

  // Get all logs for this target (e.g., all actions on a specific post)
  const logs = await AuditLogQueryBuilder.getLogsByTarget(
    supabase,
    targetType,
    targetId
  );

  console.log(`Found ${logs.length} actions on ${targetType} ${targetId}`);

  return logs;
}

/**
 * Example 8: Filtered query with pagination
 * 필터링 및 페이지네이션 조회
 */
export async function example8_FilteredQuery() {
  const supabase = await createClient();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    actionType: AuditActionType.USER_BAN,
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const result = await queryBuilder.execute();

  if (result) {
    console.log(`Total: ${result.total}`);
    console.log(`Page: ${result.page} of ${result.totalPages}`);
    console.log(`Records: ${result.data.length}`);

    return result;
  }

  return null;
}

/**
 * Example 9: Export to CSV
 * CSV로 내보내기
 */
export async function example9_ExportToCSV(
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    startDate,
    endDate,
  });

  const csv = await queryBuilder.exportToCSV();

  if (csv) {
    console.log('CSV export successful');
    console.log(`Data size: ${csv.length} bytes`);

    // In a Next.js API route, return as download:
    // return new NextResponse(csv, {
    //   headers: {
    //     'Content-Type': 'text/csv',
    //     'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
    //   },
    // });

    return csv;
  }

  return null;
}

/**
 * Example 10: Get statistics
 * 통계 조회 (액션 타입별 카운트)
 */
export async function example10_GetStatistics(
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    startDate,
    endDate,
  });

  const stats = await queryBuilder.getStatistics();

  if (stats) {
    console.log('Audit log statistics:');
    Object.entries(stats).forEach(([actionType, count]) => {
      console.log(`  ${actionType}: ${count}`);
    });

    return stats;
  }

  return null;
}

/**
 * Example 11: API route with logging
 * API 라우트에서 로깅 통합
 */
export async function example11_APIRouteWithLogging(request: NextRequest) {
  try {
    const { userId, reason } = await request.json();

    // Perform the actual admin action
    const supabase = await createClient();
    const { error } = await supabase
      .from('users')
      .update({ is_banned: true })
      .eq('id', userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to ban user' },
        { status: 500 }
      );
    }

    // Log the action
    const logger = getAuditLogger();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await logger.logUserBan(user.id, userId, reason, ipAddress, userAgent);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Example 12: Multiple actions in a transaction
 * 트랜잭션에서 여러 액션 로깅
 */
export async function example12_MultipleActions(
  adminId: string,
  postId: string,
  userId: string
) {
  const supabase = await createClient();
  const logger = getAuditLogger();

  try {
    // 1. Delete the post
    await supabase.from('posts').delete().eq('id', postId);
    await logger.logPostDelete(adminId, postId, 'Inappropriate content');

    // 2. Ban the user
    await supabase.from('users').update({ is_banned: true }).eq('id', userId);
    await logger.logUserBan(adminId, userId, 'Posted inappropriate content');

    console.log('✅ Both actions completed and logged');
    return true;
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    return false;
  }
}

/**
 * Example 13: Dashboard widget - Recent activity
 * 대시보드 위젯 - 최근 활동
 */
export async function example13_DashboardRecentActivity() {
  const supabase = await createClient();
  const recentLogs = await AuditLogQueryBuilder.getRecentLogs(supabase, 10);

  // Format for display
  const formattedLogs = recentLogs.map(log => ({
    action: log.action_type,
    target: log.target_type ? `${log.target_type}:${log.target_id}` : 'N/A',
    time: new Date(log.created_at || '').toLocaleString(),
    details: log.details,
  }));

  return formattedLogs;
}

/**
 * Example 14: Search logs by admin and action type
 * 관리자와 액션 타입으로 로그 검색
 */
export async function example14_SearchLogs(
  adminId: string,
  actionType: string,
  page: number = 1
) {
  const supabase = await createClient();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    adminId,
    actionType,
    page,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const result = await queryBuilder.execute();

  if (result) {
    console.log(`Found ${result.total} matching logs`);
    return result;
  }

  return null;
}

/**
 * Example 15: Monthly report generation
 * 월간 리포트 생성
 */
export async function example15_MonthlyReport(year: number, month: number) {
  const supabase = await createClient();

  // Calculate date range
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    startDate,
    endDate,
  });

  // Get statistics
  const stats = await queryBuilder.getStatistics();

  // Get data
  const result = await queryBuilder.execute();

  const report = {
    period: `${year}-${String(month).padStart(2, '0')}`,
    totalActions: result?.total || 0,
    statistics: stats || {},
    topActions: Object.entries(stats || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5),
  };

  console.log('Monthly Report:', report);

  return report;
}

/**
 * Example 16: Admin activity comparison
 * 관리자 활동 비교
 */
export async function example16_CompareAdminActivity(
  adminIds: string[],
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  const results = await Promise.all(
    adminIds.map(async adminId => {
      const queryBuilder = createAuditLogQueryBuilder(supabase, {
        adminId,
        startDate,
        endDate,
      });

      const result = await queryBuilder.execute();
      const stats = await queryBuilder.getStatistics();

      return {
        adminId,
        totalActions: result?.total || 0,
        actionBreakdown: stats || {},
      };
    })
  );

  console.log('Admin Activity Comparison:');
  results.forEach(({ adminId, totalActions, actionBreakdown }) => {
    console.log(`  ${adminId}: ${totalActions} actions`);
    console.log('    Breakdown:', actionBreakdown);
  });

  return results;
}

/**
 * Example 17: Alert on suspicious activity
 * 의심스러운 활동에 대한 알림
 */
export async function example17_AlertSuspiciousActivity(adminId: string) {
  const supabase = await createClient();

  // Get recent logs for this admin (last hour)
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const queryBuilder = createAuditLogQueryBuilder(supabase, {
    adminId,
    startDate: oneHourAgo,
  });

  const result = await queryBuilder.execute();

  if (result && result.total > 100) {
    console.warn(`⚠️ ALERT: Admin ${adminId} performed ${result.total} actions in the last hour!`);

    // Send notification, create alert, etc.
    return {
      alert: true,
      adminId,
      actionCount: result.total,
      timeWindow: '1 hour',
    };
  }

  return { alert: false };
}

/**
 * Example 18: Audit trail for compliance
 * 규정 준수를 위한 감사 추적
 */
export async function example18_ComplianceAuditTrail(
  targetType: string,
  targetId: string
) {
  const supabase = await createClient();

  // Get complete history for this target
  const logs = await AuditLogQueryBuilder.getLogsByTarget(
    supabase,
    targetType,
    targetId
  );

  // Format as audit trail
  const auditTrail = logs.map(log => ({
    timestamp: log.created_at,
    action: log.action_type,
    performedBy: log.admin_id,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    details: log.details,
  }));

  console.log(`Complete audit trail for ${targetType} ${targetId}:`);
  console.log(JSON.stringify(auditTrail, null, 2));

  return auditTrail;
}

// Export all examples
export const examples = {
  example1_LogUserBan,
  example2_LogPostDelete,
  example3_LogSystemSetting,
  example4_LogCustomAction,
  example5_GetRecentLogs,
  example6_GetLogsByAdmin,
  example7_GetLogsByTarget,
  example8_FilteredQuery,
  example9_ExportToCSV,
  example10_GetStatistics,
  example11_APIRouteWithLogging,
  example12_MultipleActions,
  example13_DashboardRecentActivity,
  example14_SearchLogs,
  example15_MonthlyReport,
  example16_CompareAdminActivity,
  example17_AlertSuspiciousActivity,
  example18_ComplianceAuditTrail,
};
