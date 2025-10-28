import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  validateNumericId,
  calculateRatingDistribution,
  calculateAverageRating,
  formatAIScores,
  setCacheHeaders,
  setCorsHeaders
} from '@/lib/api/utils'

// Response 인터페이스
interface PoliticianDetailResponse {
  id: number
  name: string
  party: string
  region: string
  position: string
  profile_image_url: string
  biography: string
  official_website: string
  avg_rating: number
  total_ratings: number
  ai_scores: {
    claude?: number
    gpt?: number
    gemini?: number
    perplexity?: number
    grok?: number
  }
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  total_posts: number
  created_at: string
  updated_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    // ID 유효성 검증
    const politicianId = validateNumericId(params.id)
    if (!politicianId) {
      return NextResponse.json(
        { error: 'Invalid politician ID' },
        { status: 400 }
      )
    }

    // P4D2: Optimized - Parallel queries instead of sequential
    // Fetch politician data and ratings in parallel to minimize round trips
    const [politicianResult, ratingsResult, postsResult] = await Promise.all([
      // 정치인 기본 정보 및 AI 점수 조회 (JOIN 사용)
      supabase
        .from('politicians')
        .select(`
          *,
          ai_scores (
            ai_name,
            score,
            details,
            updated_at
          )
        `)
        .eq('id', politicianId)
        .single(),

      // 평가 통계 조회 (필수 필드만 SELECT)
      supabase
        .from('ratings')
        .select('score')
        .eq('politician_id', politicianId),

      // 관련 게시글 수 조회
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('politician_id', politicianId)
    ])

    // 404 처리
    if (politicianResult.error || !politicianResult.data) {
      console.error('Politician not found:', politicianResult.error)
      return NextResponse.json(
        { error: 'Politician not found' },
        { status: 404 }
      )
    }

    const politician = politicianResult.data
    const ratings = ratingsResult.data || []
    const postsCount = postsResult.count || 0

    if (ratingsResult.error) {
      console.error('Error fetching ratings:', ratingsResult.error)
    }

    if (postsResult.error) {
      console.error('Error fetching posts count:', postsResult.error)
    }

    // 평점 분포 및 평균 계산 (유틸리티 함수 사용)
    const distribution = calculateRatingDistribution(ratings)
    const avgRating = calculateAverageRating(ratings)
    const ratingCount = ratings.length

    // AI 점수 포맷팅 (유틸리티 함수 사용)
    const ai_scores = formatAIScores(politician.ai_scores)

    // Response 구성
    const response: PoliticianDetailResponse = {
      id: politician.id,
      name: politician.name,
      party: politician.party,
      region: politician.region,
      position: politician.position,
      profile_image_url: politician.profile_image_url || '',
      biography: politician.biography || '',
      official_website: politician.official_website || '',
      avg_rating: avgRating,
      total_ratings: ratingCount,
      ai_scores,
      rating_distribution: distribution,
      total_posts: postsCount || 0,
      created_at: politician.created_at,
      updated_at: politician.updated_at
    }

    // 캐싱 헤더 설정과 함께 응답 (P4B3: 정치인 상세 - 1-2시간 캐싱)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
        'CDN-Cache-Control': 'max-age=7200',
        'Vercel-CDN-Cache-Control': 'max-age=7200'
      }
    })

  } catch (error) {
    console.error('API error:', error)

    // 에러 응답
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
    headers: setCorsHeaders()
  })
}