import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Politician } from '@/types/database'
import { logger, logSupabaseError, logPerformance } from '@/lib/logger'

// Query Parameters 인터페이스 (작업지시서 P2B1 명세)
interface PoliticiansQuery {
  page?: number          // 기본값: 1
  limit?: number         // 기본값: 10, 최대: 100
  search?: string        // 이름 검색
  party?: string         // 정당 필터 (쉼표 구분: "더불어민주당,국민의힘")
  region?: string        // 지역 필터
  position?: string      // 직급 필터
  sort?: string          // 정렬 필드 (name, avg_rating, created_at)
  order?: 'asc' | 'desc' // 정렬 방향
}

// Response 인터페이스 (작업지시서 P2B1 명세)
interface PoliticiansResponse {
  data: Politician[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const supabase = createServiceClient()

    // Query 파라미터 파싱 (P2B1 명세에 따름)
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 100)
    const search = searchParams.get('search') || ''
    const party = searchParams.get('party')?.split(',').filter(Boolean) || []
    const region = searchParams.get('region')?.split(',').filter(Boolean) || []
    const position = searchParams.get('position')?.split(',').filter(Boolean) || []
    const sort = searchParams.get('sort') || 'name'
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc'

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Supabase 쿼리 생성 (ai_scores는 선택적 조인)
    let query = supabase
      .from('politicians')
      .select('*', { count: 'exact' })

    // 검색 - 이름 검색 (한글/영문 이름 모두 검색)
    if (search) {
      query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`)
    }

    // 필터링 - 정당 (쉼표로 구분된 복수 정당 지원)
    if (party.length > 0) {
      query = query.in('party', party)
    }

    // 필터링 - 지역 (district 컬럼 사용)
    if (region.length > 0) {
      query = query.in('district', region)
    }

    // 필터링 - 직급
    if (position.length > 0) {
      query = query.in('position', position)
    }

    // 정렬 적용 (작업지시서 명세: name, avg_rating, created_at)
    switch (sort) {
      case 'avg_rating':
        query = query.order('avg_rating', { ascending: order === 'asc' })
        break
      case 'created_at':
        query = query.order('created_at', { ascending: order === 'asc' })
        break
      case 'total_ratings':
        query = query.order('total_ratings', { ascending: order === 'asc' })
        break
      case 'name':
      default:
        query = query.order('name', { ascending: order === 'asc' })
        break
    }

    // 페이지네이션 적용
    query = query.range(from, to)

    // 쿼리 실행
    const { data: politicians, error, count } = await query

    if (error) {
      logSupabaseError('politicians', 'select', error)
      return NextResponse.json(
        { error: 'Failed to fetch politicians', message: error.message },
        { status: 500 }
      )
    }

    // Response 데이터 구성
    // P2D1에서 추가된 avg_rating, total_ratings 필드가 이미 포함됨
    const data: Politician[] = politicians || []

    // 응답 구성 (P2B1 명세)
    const response: PoliticiansResponse = {
      data: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    // Log performance metrics
    const duration = Date.now() - startTime
    logPerformance('/api/politicians', duration)

    // 캐싱 헤더와 함께 응답 (P4B3: 정치인 목록 - 10-20분 캐싱)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1200',
        'CDN-Cache-Control': 'max-age=1200',
        'Vercel-CDN-Cache-Control': 'max-age=1200',
        'X-Query-Time': `${duration}ms`
      }
    })

  } catch (error) {
    logger.error('API Error: GET /api/politicians', {
      endpoint: '/api/politicians',
      method: 'GET',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 지원 (CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}