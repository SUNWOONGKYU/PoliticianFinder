// P3BA4: Real API - Health Check (Supabase Integration)
// 서버 및 데이터베이스 상태 확인

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/health
 * 시스템 헬스체크
 * - API 서버 상태
 * - Supabase 데이터베이스 연결 상태
 * - 응답 시간 측정
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  try {
    // 1. API 서버 체크
    checks.api = {
      status: 'healthy',
      latency: 0,
    };

    // 2. Supabase 데이터베이스 연결 체크
    const dbStartTime = Date.now();
    try {
      const supabase = await createClient();

      // 간단한 쿼리로 연결 확인 (users 테이블 카운트)
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      checks.database = {
        status: 'healthy',
        latency: Date.now() - dbStartTime,
      };
    } catch (dbError) {
      checks.database = {
        status: 'unhealthy',
        latency: Date.now() - dbStartTime,
        error: dbError instanceof Error ? dbError.message : 'Database connection failed',
      };
    }

    // 3. 환경 변수 체크
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    checks.environment = {
      status: Object.values(envVars).every(v => v) ? 'healthy' : 'unhealthy',
    };

    // 전체 상태 결정
    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const totalLatency = Date.now() - startTime;

    const health = {
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: totalLatency,
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const totalLatency = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        latency: totalLatency,
        checks,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
