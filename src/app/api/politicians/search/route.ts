import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  escapeSearchQuery,
  sanitizeSearchQuery,
  parseMultipleValues,
  validatePagination,
  validateSortOptions
} from '@/lib/api/searchHelpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 검색 파라미터 추출 및 검증
    const rawQuery = searchParams.get('q') || ''
    const query = sanitizeSearchQuery(rawQuery, 2, 100)
    const parties = parseMultipleValues(searchParams.get('party'), 10)
    const regions = parseMultipleValues(searchParams.get('region'), 10)
    const positions = parseMultipleValues(searchParams.get('position'), 10)
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    )
    const { field: sortField, ascending } = validateSortOptions(
      searchParams.get('sort'),
      searchParams.get('order')
    )

    // Supabase 클라이언트 생성
    const supabase = createServiceClient()

    // Supabase 쿼리 빌더 시작
    let dbQuery = supabase
      .from('politicians')
      .select('*', { count: 'exact' })

    // 이름 검색 (ILIKE를 통한 부분 문자열 검색)
    if (query && query.length >= 2) {
      const safeQuery = escapeSearchQuery(query)
      dbQuery = dbQuery.ilike('name', `%${safeQuery}%`)
    }

    // 정당 필터 (다중 선택 가능)
    if (parties.length > 0) {
      // 정당 이름 검증 (최대 50자)
      const validParties = parties.filter(p => p.length <= 50)
      if (validParties.length > 0) {
        dbQuery = dbQuery.in('party', validParties)
      }
    }

    // 지역 필터 (다중 선택 가능)
    if (regions.length > 0) {
      // 지역명 검증 (최대 50자)
      const validRegions = regions.filter(r => r.length <= 50)
      if (validRegions.length > 0) {
        dbQuery = dbQuery.in('region', validRegions)
      }
    }

    // 직급 필터 (다중 선택 가능)
    if (positions.length > 0) {
      // 직급명 검증 (최대 50자)
      const validPositions = positions.filter(p => p.length <= 50)
      if (validPositions.length > 0) {
        dbQuery = dbQuery.in('position', validPositions)
      }
    }

    // 정렬
    dbQuery = dbQuery.order(sortField, { ascending })

    // 페이지네이션
    const from = (page - 1) * limit
    const to = page * limit - 1
    dbQuery = dbQuery.range(from, to)

    // 쿼리 실행
    const { data, error, count } = await dbQuery

    // 에러 처리
    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        {
          error: 'Search failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        query,
        parties,
        regions,
        positions
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1200',
        'CDN-Cache-Control': 'max-age=1200',
        'Vercel-CDN-Cache-Control': 'max-age=1200'
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 처리 (CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}