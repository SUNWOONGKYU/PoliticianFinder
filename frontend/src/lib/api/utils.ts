/**
 * API 유틸리티 함수들
 */

// API 에러 응답 생성 헬퍼
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  const response = {
    error: message,
    ...(details && { details })
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// 캐시 헤더 설정 헬퍼
export function setCacheHeaders(
  maxAge: number = 60,
  staleWhileRevalidate: number = 300
): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'CDN-Cache-Control': `public, max-age=${maxAge}`,
    'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`,
  }
}

// CORS 헤더 설정 헬퍼
export function setCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// 페이지네이션 유효성 검사
export function validatePagination(
  page?: string | null,
  limit?: string | null
): { page: number; limit: number } {
  const parsedPage = parseInt(page || '1')
  const parsedLimit = parseInt(limit || '10')

  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1
      ? 10
      : Math.min(parsedLimit, 100), // 최대 100개로 제한
  }
}

// 정렬 파라미터 유효성 검사
export function validateSortParams(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const validSortFields = ['name', 'rating', 'ai_score', 'recent', 'created_at']
  const validSortOrders = ['asc', 'desc']

  return {
    sortBy: sortBy && validSortFields.includes(sortBy) ? sortBy : 'name',
    sortOrder: sortOrder && validSortOrders.includes(sortOrder)
      ? (sortOrder as 'asc' | 'desc')
      : 'asc',
  }
}

// 평점 분포 계산 헬퍼
export function calculateRatingDistribution(
  ratings: { score: number }[]
): Record<1 | 2 | 3 | 4 | 5, number> {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  ratings.forEach((rating) => {
    const score = Math.round(rating.score) as 1 | 2 | 3 | 4 | 5
    if (score >= 1 && score <= 5) {
      distribution[score]++
    }
  })

  return distribution
}

// 평균 평점 계산 헬퍼
export function calculateAverageRating(ratings: { score: number }[]): number {
  if (ratings.length === 0) return 0

  const sum = ratings.reduce((acc, rating) => acc + rating.score, 0)
  return Math.round((sum / ratings.length) * 10) / 10 // 소수점 1자리까지
}

// AI 점수 포맷팅 헬퍼
export function formatAIScores(
  aiScores?: Array<{ ai_name: string; score: number }> | null
): Record<string, number> {
  const scores: Record<string, number> = {}

  if (aiScores && Array.isArray(aiScores)) {
    aiScores.forEach((score) => {
      if (score.ai_name && typeof score.score === 'number') {
        scores[score.ai_name.toLowerCase()] = score.score
      }
    })
  }

  return scores
}

// 숫자 ID 유효성 검사
export function validateNumericId(id: string): number | null {
  const parsed = parseInt(id)
  return !isNaN(parsed) && parsed > 0 ? parsed : null
}

// SQL Injection 방지를 위한 문자열 이스케이프
export function sanitizeString(str: string): string {
  return str.replace(/[^a-zA-Z0-9가-힣\s-_]/g, '')
}