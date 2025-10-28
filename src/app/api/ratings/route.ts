/**
 * Ratings API Route (P4B4)
 * 시민 평가 생성 및 조회를 담당하는 API Route
 *
 * POST /api/ratings - 새로운 평가 생성 (인증 필수)
 * GET /api/ratings - 평가 목록 조회 (페이지네이션 지원)
 *
 * RATE LIMITING (P4B4):
 * - POST: 10 requests per minute (userAction)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/ratelimit'
import { logger, logSupabaseError, logPerformance } from '@/lib/logger'
import type {
  CreateRatingRequest,
  Rating,
  RatingWithProfile,
  PaginatedResponse
} from '@/types/database'

/**
 * 평균 평점 업데이트 함수
 * 평가가 생성, 수정, 삭제될 때마다 정치인의 평균 평점을 재계산
 *
 * @param supabase - Supabase 클라이언트
 * @param politician_id - 정치인 ID
 */
async function updateAverageRating(supabase: any, politician_id: number) {
  try {
    // 해당 정치인의 모든 평가 조회
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('score')
      .eq('politician_id', politician_id)

    if (ratingsError) {
      logSupabaseError('ratings', 'select', ratingsError)
      return
    }

    if (ratings && ratings.length > 0) {
      // 평균 계산
      const sum = ratings.reduce((acc: number, r: { score: number }) => acc + r.score, 0)
      const average = sum / ratings.length
      const roundedAverage = Math.round(average * 10) / 10 // 소수점 1자리까지 반올림

      // politicians 테이블 업데이트
      const { error: updateError } = await supabase
        .from('politicians')
        .update({
          avg_rating: roundedAverage,
          total_ratings: ratings.length
        })
        .eq('id', politician_id)

      if (updateError) {
        logSupabaseError('politicians', 'update', updateError)
      }
    } else {
      // 평가가 없는 경우 초기화
      await supabase
        .from('politicians')
        .update({
          avg_rating: 0,
          total_ratings: 0
        })
        .eq('id', politician_id)
    }
  } catch (error) {
    logger.error('Error updating average rating', {
      endpoint: '/api/ratings/update-average',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      metadata: { politician_id }
    })
  }
}

/**
 * POST /api/ratings
 * 새로운 평가 생성
 *
 * - 인증 필수
 * - 1인 1평가 제한 (같은 정치인에 대해 중복 평가 불가)
 * - 평가 생성 후 자동으로 평균 평점 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized rating creation attempt', {
        endpoint: '/api/ratings',
        method: 'POST',
        errorCode: 'AUTH_REQUIRED',
        statusCode: 401
      })
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // P4B4: Rate limiting (10 requests per minute)
    const rateLimitResponse = await applyRateLimit(request, "userAction", user.id)
    if (rateLimitResponse) return rateLimitResponse

    // Request body 파싱
    const body: CreateRatingRequest = await request.json()
    const { politician_id, score, comment, category } = body

    // 입력 유효성 검증
    if (!politician_id || typeof politician_id !== 'number') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 정치인 ID입니다.' },
        { status: 400 }
      )
    }

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { success: false, error: '평점은 1에서 5 사이의 값이어야 합니다.' },
        { status: 400 }
      )
    }

    // 댓글 길이 제한 (1000자)
    if (comment && comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: '댓글은 1000자를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id')
      .eq('id', politician_id)
      .single()

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 정치인입니다.' },
        { status: 404 }
      )
    }

    // 기존 평가 확인 (1인 1평가 제한)
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('politician_id', politician_id)
      .single()

    if (existingRating) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 해당 정치인을 평가하셨습니다. 기존 평가를 수정해주세요.'
        },
        { status: 409 }
      )
    }

    // 평가 생성
    const { data: newRating, error: insertError } = await supabase
      .from('ratings')
      .insert({
        user_id: user.id,
        politician_id,
        score,
        comment: comment || null,
        category: category || 'overall'
      })
      .select()
      .single()

    if (insertError) {
      logSupabaseError('ratings', 'insert', insertError, user.id)
      return NextResponse.json(
        { success: false, error: '평가 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 평균 평점 업데이트 (비동기로 처리)
    updateAverageRating(supabase, politician_id)

    logger.info('Rating created successfully', {
      endpoint: '/api/ratings',
      method: 'POST',
      userId: user.id,
      metadata: { politician_id, score }
    })

    return NextResponse.json(
      {
        success: true,
        data: newRating as Rating,
        message: '평가가 성공적으로 등록되었습니다.'
      },
      { status: 201 }
    )

  } catch (error) {
    logger.error('POST /api/ratings error', {
      endpoint: '/api/ratings',
      method: 'POST',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ratings
 * 평가 목록 조회
 *
 * Query Parameters:
 * - politician_id (required): 정치인 ID
 * - page (optional): 페이지 번호 (기본값: 1)
 * - limit (optional): 페이지당 항목 수 (기본값: 10, 최대: 50)
 * - category (optional): 카테고리 필터
 * - sort (optional): 정렬 방식 (created_at, score)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters 파싱
    const politician_id = searchParams.get('politician_id')
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'created_at'

    // politician_id 필수 체크
    if (!politician_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'politician_id는 필수 파라미터입니다.'
        },
        { status: 400 }
      )
    }

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 쿼리 빌드
    let query = supabase
      .from('ratings')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('politician_id', politician_id)

    // 카테고리 필터 적용
    if (category) {
      query = query.eq('category', category)
    }

    // 정렬 적용
    if (sort === 'score') {
      query = query.order('score', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // 페이지네이션 적용
    query = query.range(from, to)

    // 쿼리 실행
    const { data, error, count } = await query

    if (error) {
      logSupabaseError('ratings', 'select', error)
      return NextResponse.json(
        { success: false, error: '평가 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 응답 구성
    const response: PaginatedResponse<RatingWithProfile> = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    // Log performance metrics
    const duration = Date.now() - startTime
    logPerformance('/api/ratings', duration)

    // P4B3: 평가 목록 - 1-2분 캐싱
    return NextResponse.json({
      success: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'CDN-Cache-Control': 'max-age=120',
        'Vercel-CDN-Cache-Control': 'max-age=120',
        'X-Query-Time': `${duration}ms`
      }
    })

  } catch (error) {
    logger.error('GET /api/ratings error', {
      endpoint: '/api/ratings',
      method: 'GET',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}