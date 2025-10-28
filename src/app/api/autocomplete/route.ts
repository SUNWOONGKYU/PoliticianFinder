import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { escapeSearchQuery, sanitizeSearchQuery } from '@/lib/api/searchHelpers'

// 자동완성 결과 타입
interface AutocompleteSuggestion {
  id: string
  name: string
  label: string
  party?: string
  region?: string
}

// 캐시 설정 (메모리 캐시)
const cache = new Map<string, { data: AutocompleteSuggestion[], timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 1분

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'politician' // politician, party, region

    // 검색어 검증 및 정제
    const query = sanitizeSearchQuery(rawQuery, 2, 50)

    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: 'Query too short (minimum 2 characters)'
      })
    }

    // Supabase 클라이언트 생성
    const supabase = createServiceClient()

    // 캐시 키 생성
    const cacheKey = `${type}:${query.toLowerCase()}`

    // 캐시 확인
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        suggestions: cached.data,
        cached: true
      }, {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=1200',
          'CDN-Cache-Control': 'max-age=1200',
          'Vercel-CDN-Cache-Control': 'max-age=1200'
        }
      })
    }

    let suggestions: AutocompleteSuggestion[] = []

    // SQL Injection 방지를 위한 특수문자 이스케이프
    const safeQuery = escapeSearchQuery(query)

    switch (type) {
      case 'politician':
        // 정치인 이름 자동완성
        const { data: politicians, error: politicianError } = await supabase
          .from('politicians')
          .select('id, name, party, region, position')
          .ilike('name', `%${safeQuery}%`)
          .order('name')
          .limit(10)

        if (politicianError) {
          console.error('Politician autocomplete error:', politicianError)
          return NextResponse.json({ suggestions: [] })
        }

        suggestions = (politicians || []).map(p => ({
          id: p.id,
          name: p.name,
          label: `${p.name} (${p.party}, ${p.region})`,
          party: p.party,
          region: p.region
        }))
        break

      case 'party':
        // 정당명 자동완성 (중복 제거)
        const { data: parties, error: partyError } = await supabase
          .from('politicians')
          .select('party')
          .ilike('party', `%${safeQuery}%`)
          .order('party')
          .limit(50)

        if (partyError) {
          console.error('Party autocomplete error:', partyError)
          return NextResponse.json({ suggestions: [] })
        }

        // 중복 제거
        const uniqueParties = Array.from(new Set(parties?.map(p => p.party) || []))
          .slice(0, 10)

        suggestions = uniqueParties.map(party => ({
          id: party,
          name: party,
          label: party
        }))
        break

      case 'region':
        // 지역명 자동완성 (중복 제거)
        const { data: regions, error: regionError } = await supabase
          .from('politicians')
          .select('region')
          .ilike('region', `%${safeQuery}%`)
          .order('region')
          .limit(50)

        if (regionError) {
          console.error('Region autocomplete error:', regionError)
          return NextResponse.json({ suggestions: [] })
        }

        // 중복 제거
        const uniqueRegions = Array.from(new Set(regions?.map(r => r.region) || []))
          .slice(0, 10)

        suggestions = uniqueRegions.map(region => ({
          id: region,
          name: region,
          label: region
        }))
        break

      default:
        return NextResponse.json(
          {
            error: 'Invalid autocomplete type',
            suggestions: []
          },
          { status: 400 }
        )
    }

    // 캐시 저장
    cache.set(cacheKey, {
      data: suggestions,
      timestamp: Date.now()
    })

    // 캐시 크기 제한 (최대 100개 항목)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    return NextResponse.json({
      suggestions,
      cached: false
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1200',
        'CDN-Cache-Control': 'max-age=1200',
        'Vercel-CDN-Cache-Control': 'max-age=1200'
      }
    })
  } catch (error) {
    console.error('Autocomplete API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        suggestions: []
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