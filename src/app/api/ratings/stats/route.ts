/**
 * Rating Statistics API Route
 * 정치인별 평가 통계를 제공하는 API Route
 *
 * GET /api/ratings/stats?politician_id=1 - 특정 정치인의 평가 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RatingStatistics } from '@/types/database'

/**
 * GET /api/ratings/stats
 * 평가 통계 조회
 *
 * Query Parameters:
 * - politician_id (required): 정치인 ID
 *
 * 반환 정보:
 * - 총 평가 수
 * - 평균 평점
 * - 점수별 분포 (1~5점)
 * - 카테고리별 통계 (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters 파싱
    const politician_id = searchParams.get('politician_id')

    if (!politician_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'politician_id는 필수 파라미터입니다.'
        },
        { status: 400 }
      )
    }

    const politicianIdNum = parseInt(politician_id)
    if (isNaN(politicianIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 politician_id입니다.'
        },
        { status: 400 }
      )
    }

    // 모든 평가 데이터 조회
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('score, category')
      .eq('politician_id', politicianIdNum)

    if (ratingsError) {
      console.error('Ratings fetch error:', ratingsError)
      return NextResponse.json(
        { success: false, error: '평가 통계 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 통계 계산
    const totalCount = ratings?.length || 0

    if (totalCount === 0) {
      // 평가가 없는 경우
      const emptyStats: RatingStatistics = {
        politician_id: politicianIdNum,
        total_count: 0,
        average_score: 0,
        score_distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        category_breakdown: {}
      }

      return NextResponse.json({
        success: true,
        data: emptyStats
      })
    }

    // 점수별 분포 계산
    const scoreDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    // 카테고리별 통계 초기화
    const categoryStats: { [key: string]: { sum: number; count: number } } = {}

    let totalScore = 0

    // 통계 데이터 집계
    ratings.forEach((rating) => {
      const score = rating.score
      totalScore += score
      scoreDistribution[score]++

      // 카테고리별 집계
      const category = rating.category || 'overall'
      if (!categoryStats[category]) {
        categoryStats[category] = { sum: 0, count: 0 }
      }
      categoryStats[category].sum += score
      categoryStats[category].count++
    })

    // 평균 계산
    const averageScore = Math.round((totalScore / totalCount) * 10) / 10

    // 카테고리별 평균 계산
    const categoryBreakdown: any = {}
    Object.entries(categoryStats).forEach(([category, stats]) => {
      categoryBreakdown[category] = {
        count: stats.count,
        average: Math.round((stats.sum / stats.count) * 10) / 10
      }
    })

    // 통계 응답 구성
    const statistics: RatingStatistics = {
      politician_id: politicianIdNum,
      total_count: totalCount,
      average_score: averageScore,
      score_distribution: scoreDistribution as RatingStatistics['score_distribution'],
      category_breakdown: categoryBreakdown
    }

    // P4B3: 평가 집계 데이터 - 1-2분 캐싱
    return NextResponse.json({
      success: true,
      data: statistics
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'CDN-Cache-Control': 'max-age=120',
        'Vercel-CDN-Cache-Control': 'max-age=120'
      }
    })

  } catch (error) {
    console.error('GET /api/ratings/stats error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}