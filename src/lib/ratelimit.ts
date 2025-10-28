/**
 * Rate Limiting Utility (P4B4)
 * Upstash Redis 기반 분산 레이트 리미팅
 *
 * 엔드포인트 민감도에 따른 3단계 레이트 리미팅:
 * 1. Public (완화): 정치인 조회, 검색
 * 2. User Action (보통): 댓글, 평가, 좋아요
 * 3. Auth (엄격): 로그인, 회원가입, 비밀번호 재설정
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"
import { logger, logRateLimitError } from '@/lib/logger'

// Redis 클라이언트 초기화 (환경 변수가 설정된 경우에만)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * 레이트 리미트 설정
 *
 * PUBLIC: 60 requests per minute (정치인 목록, 검색)
 * USER_ACTION: 10 requests per minute (댓글, 평가 생성)
 * LIKES: 30 requests per minute (좋아요)
 * AUTH: 5 requests per 15 minutes (로그인, 회원가입)
 * PASSWORD_RESET: 3 requests per hour (비밀번호 재설정)
 */
export const ratelimit = {
  // 공개 엔드포인트 (완화)
  public: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:public",
  }) : null,

  // 정치인 상세 조회 (완화 - 높은 트래픽)
  politicianDetail: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:politician-detail",
  }) : null,

  // 사용자 액션 (보통)
  userAction: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:user-action",
  }) : null,

  // 좋아요 액션 (완화된 사용자 액션)
  likes: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "ratelimit:likes",
  }) : null,

  // 인증 엔드포인트 (엄격)
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  }) : null,

  // 비밀번호 재설정 (매우 엄격)
  passwordReset: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "60 m"),
    analytics: true,
    prefix: "ratelimit:password-reset",
  }) : null,
}

/**
 * 클라이언트 식별자 추출
 * 인증된 사용자는 user ID 기반, 익명 사용자는 IP 기반
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // IP 주소 추출 (Vercel 등 프록시 환경 지원)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() :
             request.headers.get("x-real-ip") ||
             "unknown"

  return `ip:${ip}`
}

/**
 * 레이트 리미트 체크 및 429 응답 헬퍼
 *
 * @param limiter - 사용할 레이트 리미터
 * @param identifier - 클라이언트 식별자
 * @returns null (통과) 또는 NextResponse (거부)
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<NextResponse | null> {
  // Redis가 설정되지 않은 경우 레이트 리미팅 스킵 (개발 환경)
  if (!limiter) {
    return null
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    // 헤더에 레이트 리미트 정보 포함
    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    }

    if (!success) {
      // 레이트 리미트 초과
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)

      logger.warn('Rate limit exceeded', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        metadata: {
          identifier: identifier.substring(0, 10) + '***',
          limit,
          retryAfter
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": retryAfter.toString(),
          },
        }
      )
    }

    // 통과 - 헤더 정보는 개별 라우트에서 추가 가능
    return null
  } catch (error) {
    // Redis 에러 발생 시 레이트 리미팅 스킵 (서비스 가용성 우선)
    logger.error('Rate limit check error', {
      errorCode: 'RATE_LIMIT_CHECK_ERROR',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      metadata: {
        identifier: identifier.substring(0, 10) + '***',
        message: error instanceof Error ? error.message : String(error)
      }
    })
    return null
  }
}

/**
 * 레이트 리미트 미들웨어 (간편 사용)
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const userId = await getCurrentUserId()
 *   const rateLimitResponse = await applyRateLimit(request, "userAction", userId)
 *   if (rateLimitResponse) return rateLimitResponse
 *
 *   // ... 나머지 로직
 * }
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  limiterType: keyof typeof ratelimit,
  userId?: string
): Promise<NextResponse | null> {
  const limiter = ratelimit[limiterType]
  const identifier = getIdentifier(request, userId)
  return checkRateLimit(limiter, identifier)
}
