/**
 * P5B3: API Versioning - Feedback v1
 *
 * Version 1 of the feedback endpoint
 * POST /api/v1/feedback - Submit feedback
 * GET /api/v1/feedback - Retrieve feedback (admin only)
 *
 * This is a versioned wrapper that delegates to the main feedback API
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST as feedbackPostV1, GET as feedbackGetV1 } from '../../feedback/route';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/feedback
 * Submit user feedback (v1)
 */
export async function POST(request: NextRequest) {
  const response = await feedbackPostV1(request);

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
 * GET /api/v1/feedback
 * Retrieve feedback list (admin only, v1)
 */
export async function GET(request: NextRequest) {
  const response = await feedbackGetV1(request);

  // Add API version header
  const headers = new Headers(response.headers);
  headers.set('X-API-Version', 'v1');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
