/**
 * P5B2: Enhanced Health Check Endpoint
 *
 * Provides comprehensive system health status including Redis
 * Monitors: Database (Supabase), Redis (Upstash), API responsiveness
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: 'ok' | 'error' | 'disabled';
      responseTime?: number;
      error?: string;
    };
    api: {
      status: 'ok' | 'error';
      responseTime?: number;
    };
  };
  version: string;
  environment: string;
}

const startTime = Date.now();

/**
 * Health check endpoint with Redis monitoring
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: 'ok' },
      redis: { status: 'ok' },
      api: { status: 'ok' },
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    const dbCheckStart = Date.now();
    const supabase = await createClient();

    try {
      const { error } = await supabase.from('politicians').select('id').limit(1).single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is acceptable
        throw error;
      }

      healthStatus.checks.database.responseTime = Date.now() - dbCheckStart;
      healthStatus.checks.database.status = 'ok';
    } catch (dbError: any) {
      healthStatus.checks.database.status = 'error';
      healthStatus.checks.database.error = dbError.message;
      healthStatus.status = 'degraded';
    }

    // Check Redis connection (P5B2)
    const redisCheckStart = Date.now();
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        // Perform a simple ping operation
        const testKey = `health:check:${Date.now()}`;
        await redis.set(testKey, 'ok', { ex: 10 });
        const result = await redis.get(testKey);
        await redis.del(testKey);

        if (result === 'ok') {
          healthStatus.checks.redis.responseTime = Date.now() - redisCheckStart;
          healthStatus.checks.redis.status = 'ok';
        } else {
          throw new Error('Redis ping failed');
        }
      } catch (redisError: any) {
        healthStatus.checks.redis.status = 'error';
        healthStatus.checks.redis.error = redisError.message;
        healthStatus.status = 'degraded';
      }
    } else {
      // Redis not configured
      healthStatus.checks.redis.status = 'disabled';
      healthStatus.checks.redis.responseTime = 0;
    }

    // Check API responsiveness
    const apiCheckStart = Date.now();
    healthStatus.checks.api.responseTime = Date.now() - apiCheckStart;

    // Determine overall status
    if (healthStatus.checks.database.status === 'error') {
      healthStatus.status = 'unhealthy';
    } else if (
      healthStatus.checks.redis.status === 'error' ||
      healthStatus.checks.database.status === 'error'
    ) {
      healthStatus.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: { status: 'error', error: error.message },
          redis: { status: 'error', error: error.message },
          api: { status: 'error' },
        },
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

/**
 * Simple ping endpoint for basic uptime checks
 * HEAD /api/health
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
