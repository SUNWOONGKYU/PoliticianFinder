/**
 * P5B3: API Versioning - Health Check v1
 *
 * Version 1 of the health check endpoint
 * GET /api/v1/health
 *
 * This is a versioned wrapper that delegates to the main health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as healthCheckV1 } from '../../health/route';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/v1/health
 * Versioned health check endpoint
 */
export async function GET(request: NextRequest) {
  const response = await healthCheckV1(request);

  // Add API version header
  const headers = new Headers(response.headers);
  headers.set('X-API-Version', 'v1');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * HEAD /api/v1/health
 * Simple ping for v1 API
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      'X-API-Version': 'v1',
    },
  });
}
