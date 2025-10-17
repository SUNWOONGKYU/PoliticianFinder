/**
 * P5B3 + P5B4: Versioned Log Collection API
 *
 * Version 1 of the log collection endpoint
 * GET /api/v1/logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as logsGetV1 } from '../../logs/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/logs
 * Retrieve collected logs (v1, admin only)
 */
export async function GET(request: NextRequest) {
  const response = await logsGetV1(request);

  // Add API version header
  const headers = new Headers(response.headers);
  headers.set('X-API-Version', 'v1');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
