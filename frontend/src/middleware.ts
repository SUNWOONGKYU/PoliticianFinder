/**
 * Next.js Edge Middleware for CORS and Security Headers
 * Runs on the Edge Runtime for optimal performance
 * Reference: OWASP Security Headers
 * Enhanced with Rate Limiting and XSS Protection (P3S1, P3S2)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins based on environment
const ALLOWED_ORIGINS = isProduction
  ? [
      'https://politician-finder.vercel.app',
      'https://frontend-steel-psi-45.vercel.app',
      'https://politicianfinder.vercel.app',
      'https://www.politicianfinder.com',
      'https://politicianfinder.com',
    ]
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
    ];

// API routes that require CORS handling
const API_ROUTES = ['/api'];

/**
 * Check if the origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Accept, Accept-Language, Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Request-ID'
  );
  response.headers.set(
    'Access-Control-Expose-Headers',
    'Content-Type, X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  );
  response.headers.set('Access-Control-Max-Age', '3600');
}

/**
 * Add security headers to response
 * Reference: OWASP Secure Headers Project
 */
function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Content Security Policy (CSP) for production
  if (isProduction) {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.politicianfinder.com https://*.supabase.co wss://*.supabase.co https://vercel.live https://politician-finder.vercel.app https://frontend-steel-psi-45.vercel.app",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);

    // HTTP Strict Transport Security
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
}

/**
 * Log CORS requests for monitoring
 */
function logCorsRequest(
  request: NextRequest,
  allowed: boolean,
  origin: string | null
) {
  if (isDevelopment) {
    console.log(`[CORS] ${allowed ? '✓' : '✗'} ${request.method} ${request.url}`, {
      origin,
      allowed,
    });
  }
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;

  // Check if this is an API route
  const isApiRoute = API_ROUTES.some((route) => pathname.startsWith(route));

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });

    if (isApiRoute && origin) {
      const allowed = isOriginAllowed(origin);
      logCorsRequest(request, allowed, origin);

      if (allowed) {
        addCorsHeaders(response, origin);
      } else {
        // Return 403 for disallowed origins
        return new NextResponse(
          JSON.stringify({
            error: 'CORS_ERROR',
            message: 'Origin not allowed',
            origin,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    addSecurityHeaders(response);
    return response;
  }

  // Handle regular requests
  const response = NextResponse.next();

  // Add CORS headers for API routes
  if (isApiRoute && origin) {
    const allowed = isOriginAllowed(origin);
    logCorsRequest(request, allowed, origin);

    if (allowed) {
      addCorsHeaders(response, origin);
    }
  }

  // Always add security headers
  addSecurityHeaders(response);

  // Add request ID for tracing
  const requestId = request.headers.get('X-Request-ID');
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};