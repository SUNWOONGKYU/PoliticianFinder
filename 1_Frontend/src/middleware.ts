// Task: P6O4
// Security Middleware - Rate Limiting + CORS + CSP + Admin Protection
// Generated: 2025-11-10
// Agent: devops-engineer

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT = {
  API: { requests: 100, window: 60 * 1000 }, // 100 req/min
  LOGIN: { requests: 5, window: 60 * 1000 }, // 5 req/min
  SIGNUP: { requests: 3, window: 60 * 60 * 1000 }, // 3 req/hour
};

// In-memory rate limit store (use Redis/Upstash in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function checkRateLimit(
  key: string,
  limit: { requests: number; window: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + limit.window;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit.requests - 1, resetTime };
  }

  if (record.count < limit.requests) {
    record.count++;
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: limit.requests - record.count, resetTime: record.resetTime };
  }

  return { allowed: false, remaining: 0, resetTime: record.resetTime };
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // === 0. PKCE Error Prevention ===
  // If /auth/login has a 'code' parameter, redirect to /auth/callback
  // This prevents "invalid request: both auth code and code verifier should be non-empty" error
  if (pathname === '/auth/login' && searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', searchParams.get('code')!);
    if (searchParams.has('next')) {
      callbackUrl.searchParams.set('next', searchParams.get('next')!);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // === 1. Rate Limiting === BUGFIX_002: Restored to production values
  let rateLimit = RATE_LIMIT.API;
  if (pathname.startsWith('/api/auth/login')) {
    rateLimit = RATE_LIMIT.LOGIN;
  } else if (pathname.startsWith('/api/auth/signup')) {
    rateLimit = RATE_LIMIT.SIGNUP;
  }

  const rateLimitKey = getRateLimitKey(ip, pathname);
  const rateLimitResult = checkRateLimit(rateLimitKey, rateLimit);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(rateLimit.requests),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // === 2. Admin Protection (기존 로직 유지) ===
  if (pathname !== '/admin/login' && pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // === 3. Create response with security headers ===
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP (Content Security Policy)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com;
    media-src 'self';
    object-src 'none';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // CORS Headers
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  }

  // Rate Limit Headers
  response.headers.set('X-RateLimit-Limit', String(rateLimit.requests));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

  return response;
}

// middleware가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
