/**
 * Rate Limiting Middleware
 * 작업 ID: P2E2
 * 작성일: 2025-01-17
 * 설명: 댓글 시스템을 위한 Rate Limiting 구현
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ===========================
// Redis 클라이언트 설정
// ===========================
const redis = process.env.UPSTASH_REDIS_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!
    })
  : null

// ===========================
// Rate Limiter 정의
// ===========================
export const rateLimiters = {
  // 댓글 작성: 1분당 10개
  commentCreate: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'rl:comment:create'
      })
    : null,

  // 댓글 수정: 5분당 20개
  commentUpdate: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '5 m'),
        analytics: true,
        prefix: 'rl:comment:update'
      })
    : null,

  // 댓글 삭제: 1분당 5개
  commentDelete: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'rl:comment:delete'
      })
    : null,

  // 댓글 조회: 1분당 100개
  commentRead: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'rl:comment:read'
      })
    : null,

  // 전역 API: 1분당 60개
  global: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'rl:global'
      })
    : null
}

// ===========================
// 메모리 기반 Rate Limiter (개발용)
// ===========================
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private limit: number,
    private windowMs: number
  ) {
    // 주기적으로 만료된 엔트리 정리
    setInterval(() => this.cleanup(), windowMs)
  }

  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || entry.resetAt <= now) {
      // 새 윈도우 시작
      const resetAt = now + this.windowMs
      this.store.set(identifier, { count: 1, resetAt })

      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetAt
      }
    }

    if (entry.count >= this.limit) {
      // 한도 초과
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: entry.resetAt
      }
    }

    // 카운트 증가
    entry.count++
    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - entry.count,
      reset: entry.resetAt
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key)
      }
    }
  }
}

// 개발 환경용 메모리 기반 Rate Limiters
const memoryLimiters = {
  commentCreate: new MemoryRateLimiter(10, 60000),    // 1분당 10개
  commentUpdate: new MemoryRateLimiter(20, 300000),   // 5분당 20개
  commentDelete: new MemoryRateLimiter(5, 60000),     // 1분당 5개
  commentRead: new MemoryRateLimiter(100, 60000),     // 1분당 100개
  global: new MemoryRateLimiter(60, 60000)            // 1분당 60개
}

// ===========================
// Rate Limiting 미들웨어
// ===========================
export async function withRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters,
  identifier?: string
): Promise<NextResponse | null> {
  try {
    // 식별자 결정 (기본: IP 주소)
    const id = identifier ||
      request.headers.get('x-forwarded-for') ||
      request.ip ||
      'anonymous'

    // Rate Limiter 선택 (Redis 또는 Memory)
    const limiter = rateLimiters[limiterType] || memoryLimiters[limiterType]

    if (!limiter) {
      console.warn(`Rate limiter not configured for: ${limiterType}`)
      return null
    }

    // Rate Limiting 체크
    const result = await limiter.limit(id)

    // 헤더 설정
    const headers = new Headers({
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      'X-RateLimit-Reset-After': Math.max(0, Math.floor((result.reset - Date.now()) / 1000)).toString()
    })

    if (!result.success) {
      // Rate Limit 초과
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: Math.floor((result.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers
        }
      )
    }

    // 성공 시 헤더만 반환 (요청 계속 진행)
    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    // 에러 발생 시 요청 허용 (fail-open)
    return null
  }
}

// ===========================
// IP 기반 Rate Limiting
// ===========================
export async function withIpRateLimit(
  request: NextRequest,
  options: {
    limit?: number
    window?: string
    prefix?: string
  } = {}
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') ||
    request.ip ||
    'unknown'

  // IP별 커스텀 Rate Limiter
  const ipLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          options.limit || 30,
          options.window || '1 m'
        ),
        analytics: true,
        prefix: options.prefix || 'rl:ip'
      })
    : new MemoryRateLimiter(
        options.limit || 30,
        options.window === '5 m' ? 300000 : 60000
      )

  const result = await ipLimiter.limit(ip)

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests from this IP',
        retryAfter: Math.floor((result.reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.floor((result.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return null
}

// ===========================
// 사용자별 Rate Limiting
// ===========================
export async function withUserRateLimit(
  userId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  request?: NextRequest
): Promise<{ allowed: boolean; headers?: Headers }> {
  const limiterKey = `comment${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof rateLimiters
  const limiter = rateLimiters[limiterKey] || memoryLimiters[limiterKey]

  if (!limiter) {
    return { allowed: true }
  }

  const result = await limiter.limit(userId)

  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString()
  })

  return {
    allowed: result.success,
    headers
  }
}

// ===========================
// API Route Handler 래퍼
// ===========================
export function withRateLimitHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    limiterType?: keyof typeof rateLimiters
    useIp?: boolean
    ipLimit?: number
    ipWindow?: string
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // IP 기반 Rate Limiting
    if (options.useIp) {
      const ipLimitResponse = await withIpRateLimit(request, {
        limit: options.ipLimit,
        window: options.ipWindow
      })

      if (ipLimitResponse) {
        return ipLimitResponse
      }
    }

    // 일반 Rate Limiting
    if (options.limiterType) {
      const limitResponse = await withRateLimit(request, options.limiterType)

      if (limitResponse) {
        return limitResponse
      }
    }

    // 핸들러 실행
    return handler(request)
  }
}

// ===========================
// 사용 예시
// ===========================
/*
// API Route에서 사용
import { withRateLimitHandler } from '@/middleware/rate-limit'

export const POST = withRateLimitHandler(
  async (request: NextRequest) => {
    // 댓글 생성 로직
    return NextResponse.json({ success: true })
  },
  {
    limiterType: 'commentCreate',
    useIp: true,
    ipLimit: 20,
    ipWindow: '1 m'
  }
)

// 또는 함수 내에서 직접 사용
export async function POST(request: NextRequest) {
  const userId = await getUserId(request)

  const { allowed, headers } = await withUserRateLimit(userId, 'create')

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers }
    )
  }

  // 댓글 생성 로직
  return NextResponse.json(
    { success: true },
    { headers }
  )
}
*/

// ===========================
// Rate Limit 상태 확인
// ===========================
export async function getRateLimitStatus(
  identifier: string,
  limiterType: keyof typeof rateLimiters
): Promise<{
  limit: number
  remaining: number
  reset: Date
}> {
  const limiter = rateLimiters[limiterType]

  if (!limiter || !redis) {
    return {
      limit: 0,
      remaining: 0,
      reset: new Date()
    }
  }

  // 현재 상태 확인 (카운트 증가 없이)
  const key = `${limiter.prefix}:${identifier}`
  const data = await redis.get(key)

  if (!data) {
    return {
      limit: 10, // 기본값
      remaining: 10,
      reset: new Date(Date.now() + 60000)
    }
  }

  // 실제 구현은 Upstash의 내부 구조에 따라 다를 수 있음
  return {
    limit: 10,
    remaining: Math.max(0, 10 - (data as number)),
    reset: new Date(Date.now() + 60000)
  }
}

export default withRateLimitHandler