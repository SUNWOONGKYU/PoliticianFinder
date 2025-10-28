/**
 * Rate Limiting Module
 * 작업 ID: P3S2
 * 작성일: 2025-01-17
 *
 * OWASP Rate Limiting 가이드라인 기반
 * DDoS 및 Brute Force 공격 방어
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Rate Limiter 설정 타입
 */
interface RateLimitConfig {
  requests: number;
  window: string | number;
  identifier?: string;
  analytics?: boolean;
}

/**
 * Rate Limit 응답 타입
 */
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  reason?: string;
}

/**
 * 엔드포인트별 Rate Limit 설정
 */
const RATE_LIMIT_CONFIGS = {
  // 인증 관련
  'auth/login': { requests: 5, window: '1m' },           // 1분에 5회
  'auth/signup': { requests: 3, window: '10m' },         // 10분에 3회
  'auth/reset-password': { requests: 3, window: '1h' },  // 1시간에 3회
  'auth/verify-otp': { requests: 5, window: '5m' },      // 5분에 5회

  // 댓글 관련
  'comments/create': { requests: 10, window: '1m' },     // 1분에 10개
  'comments/update': { requests: 20, window: '5m' },     // 5분에 20개
  'comments/delete': { requests: 5, window: '1m' },      // 1분에 5개
  'comments/report': { requests: 5, window: '10m' },     // 10분에 5개

  // 게시글 관련
  'posts/create': { requests: 3, window: '10m' },        // 10분에 3개
  'posts/update': { requests: 10, window: '5m' },        // 5분에 10개
  'posts/delete': { requests: 3, window: '5m' },         // 5분에 3개

  // 평가 관련
  'ratings/create': { requests: 5, window: '5m' },       // 5분에 5개
  'ratings/update': { requests: 10, window: '10m' },     // 10분에 10개

  // 검색/조회
  'search': { requests: 30, window: '1m' },              // 1분에 30회
  'api/read': { requests: 100, window: '1m' },           // 1분에 100회

  // 파일 업로드
  'upload/image': { requests: 10, window: '10m' },       // 10분에 10개
  'upload/file': { requests: 5, window: '10m' },         // 10분에 5개

  // 기본값
  'default': { requests: 60, window: '1m' }              // 1분에 60회
} as const;

/**
 * Redis 클라이언트 초기화 (Upstash)
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

/**
 * IP 기반 Rate Limiter 생성
 */
function createIpRateLimiter(config: RateLimitConfig) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: config.analytics ?? true,
    prefix: `ratelimit:ip:${config.identifier || 'default'}`
  });
}

/**
 * 사용자 기반 Rate Limiter 생성
 */
function createUserRateLimiter(config: RateLimitConfig) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(config.requests, config.window, config.requests),
    analytics: config.analytics ?? true,
    prefix: `ratelimit:user:${config.identifier || 'default'}`
  });
}

/**
 * 메모리 기반 Rate Limiter (Redis 없는 환경용)
 */
class InMemoryRateLimiter {
  private storage = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;

    // 주기적으로 만료된 엔트리 정리
    setInterval(() => this.cleanup(), windowMs);
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.storage.get(identifier);

    if (!record || record.resetAt <= now) {
      // 새로운 윈도우 시작
      this.storage.set(identifier, {
        count: 1,
        resetAt: now + this.window
      });

      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: now + this.window
      };
    }

    if (record.count >= this.limit) {
      // Rate limit 초과
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: record.resetAt,
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      };
    }

    // 카운트 증가
    record.count++;
    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - record.count,
      reset: record.resetAt
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (value.resetAt <= now) {
        this.storage.delete(key);
      }
    }
  }
}

/**
 * Rate Limiting 미들웨어 (Next.js API Routes)
 */
export async function rateLimitMiddleware(
  request: Request,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'default'
): Promise<RateLimitResult> {
  try {
    const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.default;

    // IP 추출
    const ip = getClientIp(request);

    // Redis 사용 가능 여부 확인
    if (process.env.UPSTASH_REDIS_URL) {
      const limiter = createIpRateLimiter({
        ...config,
        identifier: endpoint
      });

      const result = await limiter.limit(ip);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil(result.remaining / 1000),
        reason: result.reason
      };
    } else {
      // Fallback: 메모리 기반 Rate Limiting
      const windowMs = parseWindow(config.window);
      const limiter = getOrCreateMemoryLimiter(endpoint, config.requests, windowMs);

      return await limiter.limit(ip);
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // 에러 발생 시 요청 허용 (fail-open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }
}

/**
 * 사용자별 Rate Limiting
 */
export async function rateLimitUser(
  userId: string,
  action: keyof typeof RATE_LIMIT_CONFIGS = 'default'
): Promise<RateLimitResult> {
  try {
    const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default;

    if (process.env.UPSTASH_REDIS_URL) {
      const limiter = createUserRateLimiter({
        ...config,
        identifier: action
      });

      const result = await limiter.limit(userId);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil(result.remaining / 1000)
      };
    } else {
      // Fallback
      const windowMs = parseWindow(config.window);
      const limiter = getOrCreateMemoryLimiter(action, config.requests, windowMs);

      return await limiter.limit(`user:${userId}`);
    }
  } catch (error) {
    console.error('User rate limiting error:', error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }
}

/**
 * DDoS 방어용 엄격한 Rate Limiting
 */
export async function ddosProtection(request: Request): Promise<boolean> {
  const ip = getClientIp(request);

  // 매우 엄격한 제한: 1초에 10회
  const limiter = new InMemoryRateLimiter(10, 1000);
  const result = await limiter.limit(ip);

  if (!result.success) {
    console.warn(`Possible DDoS attack from IP: ${ip}`);
    // 여기서 IP 차단 등 추가 조치 가능
    await blockIpTemporarily(ip, 3600); // 1시간 차단
  }

  return result.success;
}

/**
 * Brute Force 방어
 */
export async function bruteForcProtection(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 900000 // 15분
): Promise<{ allowed: boolean; attemptsLeft: number }> {
  const key = `bruteforce:${identifier}`;

  if (process.env.UPSTASH_REDIS_URL) {
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000));
    }

    return {
      allowed: attempts <= maxAttempts,
      attemptsLeft: Math.max(0, maxAttempts - attempts)
    };
  } else {
    // Fallback
    const limiter = new InMemoryRateLimiter(maxAttempts, windowMs);
    const result = await limiter.limit(key);

    return {
      allowed: result.success,
      attemptsLeft: result.remaining
    };
  }
}

/**
 * IP 임시 차단
 */
async function blockIpTemporarily(ip: string, durationSeconds: number) {
  const key = `blocked:ip:${ip}`;

  if (process.env.UPSTASH_REDIS_URL) {
    await redis.setex(key, durationSeconds, 'blocked');
  } else {
    // 메모리에 저장
    blockedIps.set(ip, Date.now() + durationSeconds * 1000);
  }
}

/**
 * IP 차단 확인
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const key = `blocked:ip:${ip}`;

  if (process.env.UPSTASH_REDIS_URL) {
    const blocked = await redis.get(key);
    return blocked === 'blocked';
  } else {
    const blockedUntil = blockedIps.get(ip);
    if (blockedUntil && blockedUntil > Date.now()) {
      return true;
    }
    blockedIps.delete(ip);
    return false;
  }
}

/**
 * 클라이언트 IP 추출
 */
function getClientIp(request: Request): string {
  const headers = request.headers;

  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Vercel
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Standard
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  // Fallback
  return '127.0.0.1';
}

/**
 * 윈도우 문자열 파싱
 */
function parseWindow(window: string | number): number {
  if (typeof window === 'number') return window;

  const match = window.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid window format: ${window}`);

  const [, value, unit] = match;
  const multipliers: Record<string, number> = {
    's': 1000,
    'm': 60000,
    'h': 3600000,
    'd': 86400000
  };

  return parseInt(value) * multipliers[unit];
}

/**
 * 메모리 Rate Limiter 인스턴스 관리
 */
const memoryLimiters = new Map<string, InMemoryRateLimiter>();
const blockedIps = new Map<string, number>();

function getOrCreateMemoryLimiter(
  key: string,
  limit: number,
  windowMs: number
): InMemoryRateLimiter {
  const existing = memoryLimiters.get(key);
  if (existing) return existing;

  const limiter = new InMemoryRateLimiter(limit, windowMs);
  memoryLimiters.set(key, limiter);
  return limiter;
}

/**
 * Rate Limit 헤더 설정
 */
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
) {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
}

/**
 * Rate Limit 에러 응답 생성
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  setRateLimitHeaders(headers, result);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers
    }
  );
}

export default {
  rateLimitMiddleware,
  rateLimitUser,
  ddosProtection,
  bruteForcProtection,
  isIpBlocked,
  setRateLimitHeaders,
  createRateLimitResponse
};