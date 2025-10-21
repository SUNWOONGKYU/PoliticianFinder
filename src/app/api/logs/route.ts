/**
 * P5B4: Log Collection API
 *
 * Admin-only endpoint for accessing collected logs
 * GET /api/logs - Retrieve logs with filtering and export options
 *
 * Features:
 * - Filter by level, time range, endpoint
 * - Export to JSON/CSV
 * - Statistics and metrics
 * - Admin authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logCollector, getErrorSummary, getPerformanceMetrics } from '@/lib/log-collector';
import { logger, LogLevel } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logs
 * Retrieve collected logs (admin only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      logger.warn('Unauthorized log access attempt', {
        endpoint: '/api/logs',
        method: 'GET',
        userId: user.id,
        errorCode: 'FORBIDDEN',
        statusCode: 403,
      });

      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const format = searchParams.get('format') || 'json';
    const level = searchParams.get('level') as LogLevel | null;
    const endpoint = searchParams.get('endpoint');
    const userId = searchParams.get('userId');
    const errorCode = searchParams.get('errorCode');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 1000);

    // Time range filters
    const startTimeStr = searchParams.get('startTime');
    const endTimeStr = searchParams.get('endTime');
    const lastMinutes = searchParams.get('lastMinutes');

    let startTime: Date | undefined;
    let endTime: Date | undefined;

    if (lastMinutes) {
      endTime = new Date();
      startTime = new Date(endTime.getTime() - parseInt(lastMinutes) * 60000);
    } else {
      if (startTimeStr) startTime = new Date(startTimeStr);
      if (endTimeStr) endTime = new Date(endTimeStr);
    }

    // Handle different actions
    switch (action) {
      case 'stats': {
        // Return statistics
        const stats = logCollector.getStats({
          level,
          startTime,
          endTime,
          endpoint,
          userId,
          errorCode,
        });

        return NextResponse.json({
          success: true,
          data: stats,
          collectionSize: logCollector.size(),
        });
      }

      case 'errors': {
        // Return error summary
        const minutes = lastMinutes ? parseInt(lastMinutes) : 60;
        const errorSummary = getErrorSummary(minutes);

        return NextResponse.json({
          success: true,
          data: errorSummary,
          timeRange: `Last ${minutes} minutes`,
        });
      }

      case 'performance': {
        // Return performance metrics
        const metrics = getPerformanceMetrics(endpoint || undefined);

        return NextResponse.json({
          success: true,
          data: metrics,
          endpoint: endpoint || 'all',
        });
      }

      case 'export': {
        // Export logs
        const exportData = logCollector.export({
          format: format as 'json' | 'csv',
          filter: {
            level,
            startTime,
            endTime,
            endpoint,
            userId,
            errorCode,
          },
        });

        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        const filename = `logs-${new Date().toISOString()}.${format}`;

        return new NextResponse(exportData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      case 'clear': {
        // Clear logs (admin only, with confirmation)
        const confirm = searchParams.get('confirm');
        if (confirm !== 'true') {
          return NextResponse.json(
            {
              success: false,
              error: 'Confirmation required. Add ?confirm=true to clear logs.',
            },
            { status: 400 }
          );
        }

        logCollector.clear();

        logger.info('Logs cleared by admin', {
          endpoint: '/api/logs',
          method: 'GET',
          userId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Logs cleared successfully',
        });
      }

      case 'list':
      default: {
        // Return filtered logs
        const allLogs = logCollector.filter({
          level,
          startTime,
          endTime,
          endpoint,
          userId,
          errorCode,
        });

        const logs = allLogs.slice(-limit);

        return NextResponse.json({
          success: true,
          data: logs,
          pagination: {
            returned: logs.length,
            total: allLogs.length,
            limit,
          },
          filter: {
            level,
            startTime: startTime?.toISOString(),
            endTime: endTime?.toISOString(),
            endpoint,
            userId,
            errorCode,
          },
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('GET /api/logs error', {
      endpoint: '/api/logs',
      method: 'GET',
      errorCode: 'LOG_API_ERROR',
      statusCode: 500,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { message: errorMessage },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve logs',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/logs
 * CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
