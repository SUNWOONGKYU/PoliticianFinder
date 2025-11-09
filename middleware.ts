// Project Grid Task ID: P1BI2
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
const MAX_REQUESTS_PER_MINUTE = 10;
const WINDOW_SIZE_IN_SECONDS = 60;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS settings
  response.headers.set('Access-Control-Allow-Origin', '*'); // Restrict to specific origins in production
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response; // Handle preflight requests
  }

  // Rate Limiting (simplified in-memory store)
  const ip = request.ip || '127.0.0.1'; // Fallback for local development

  const now = Date.now();
  const record = requestCounts.get(ip);

  if (record && now - record.timestamp < WINDOW_SIZE_IN_SECONDS * 1000) {
    if (record.count >= MAX_REQUESTS_PER_MINUTE) {
      return new NextResponse('Too Many Requests', { status: 429, headers: response.headers });
    }
    record.count++;
  } else {
    requestCounts.set(ip, { count: 1, timestamp: now });
  }

  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401, headers: response.headers });
  }

  try {
    // Placeholder for actual JWT verification logic
    const isValid = true; // Replace with actual JWT verification

    if (!isValid) {
      return new NextResponse('Unauthorized', { status: 401, headers: response.headers });
    }
  } catch (error) {
    console.error('JWT verification error:', error);
    return new NextResponse('Unauthorized', { status: 401, headers: response.headers });
  }

  // Proceed to the next middleware or API route with CORS headers
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
