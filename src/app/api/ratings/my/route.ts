/**
 * My Ratings API Route
 * 현재 로그인한 사용자의 평가 목록을 조회하는 API Route
 *
 * GET /api/ratings/my - 내 평가 목록 조회
 * GET /api/ratings/my?politician_id=1 - 특정 정치인에 대한 내 평가 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  Rating,
  RatingWithPolitician,
  PaginatedResponse
} from '@/types/database'

/**
 * GET /api/ratings/my
 * 내 평가 목록 조회
 *
 * Query Parameters:
 * - politician_id (optional): 특정 정치인 ID로 필터링
 * - page (optional): 페이지 번호 (기본값: 1)
 * - limit (optional): 페이지당 항목 수 (기본값: 10, 최대: 50)
 * - sort (optional): 정렬 방식 (created_at, updated_at, score)
 *
 * 반환 정보:
 * - 평가 정보
 * - 정치인 정보 (이름, 정당, 프로필 이미지 등)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Query parameters 파싱
    const politician_id = searchParams.get('politician_id')
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)
    const sort = searchParams.get('sort') || 'created_at'

    // 특정 정치인에 대한 평가만 조회하는 경우
    if (politician_id) {
      const { data: rating, error: singleError } = await supabase
        .from('ratings')
        .select(`
          *,
          politicians:politician_id (
            id,
            name,
            party,
            position,
            district,
            profile_image_url,
            avg_rating,
            total_ratings
          )
        `)
        .eq('user_id', user.id)
        .eq('politician_id', politician_id)
        .single()

      if (singleError) {
        // 평가가 없는 경우
        if (singleError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            data: null,
            message: '해당 정치인에 대한 평가가 없습니다.'
          })
        }

        console.error('Single rating fetch error:', singleError)
        return NextResponse.json(
          { success: false, error: '평가 조회에 실패했습니다.' },
          { status: 500 }
        )
      }

      // P4B3: 내 평가 조회 - private 캐싱 1분
      return NextResponse.json({
        success: true,
        data: rating as RatingWithPolitician
      }, {
        headers: {
          'Cache-Control': 'private, max-age=60'
        }
      })
    }

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 전체 평가 목록 조회
    let query = supabase
      .from('ratings')
      .select(`
        *,
        politicians:politician_id (
          id,
          name,
          party,
          position,
          district,
          profile_image_url,
          avg_rating,
          total_ratings
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    // 정렬 적용
    switch (sort) {
      case 'updated_at':
        query = query.order('updated_at', { ascending: false })
        break
      case 'score':
        query = query.order('score', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 페이지네이션 적용
    query = query.range(from, to)

    // 쿼리 실행
    const { data, error, count } = await query

    if (error) {
      console.error('My ratings fetch error:', error)
      return NextResponse.json(
        { success: false, error: '평가 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 응답 구성
    const response: PaginatedResponse<RatingWithPolitician> = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    // P4B3: 내 평가 목록 - private 캐싱 1분
    return NextResponse.json({
      success: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('GET /api/ratings/my error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ratings/my
 * 내 모든 평가 삭제 (위험한 작업)
 *
 * Body:
 * - confirmation: "DELETE_ALL_MY_RATINGS" (안전 확인용)
 *
 * 주의: 이 엔드포인트는 사용자의 모든 평가를 삭제합니다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 확인 문구 체크
    const body = await request.json()
    if (body.confirmation !== 'DELETE_ALL_MY_RATINGS') {
      return NextResponse.json(
        {
          success: false,
          error: '삭제 확인이 필요합니다. confirmation: "DELETE_ALL_MY_RATINGS"를 전송해주세요.'
        },
        { status: 400 }
      )
    }

    // 삭제할 평가들의 정치인 ID 목록 조회 (평균 평점 업데이트용)
    const { data: ratingsToDelete, error: fetchError } = await supabase
      .from('ratings')
      .select('politician_id')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Ratings fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: '평가 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 모든 평가 삭제
    const { error: deleteError } = await supabase
      .from('ratings')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Ratings delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: '평가 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 영향받은 정치인들의 평균 평점 업데이트
    if (ratingsToDelete && ratingsToDelete.length > 0) {
      const uniquePoliticianIds = [...new Set(ratingsToDelete.map(r => r.politician_id))]

      for (const politicianId of uniquePoliticianIds) {
        // 각 정치인의 새로운 평균 계산
        const { data: remainingRatings } = await supabase
          .from('ratings')
          .select('score')
          .eq('politician_id', politicianId)

        if (remainingRatings && remainingRatings.length > 0) {
          const sum = remainingRatings.reduce((acc, r) => acc + r.score, 0)
          const avg = Math.round((sum / remainingRatings.length) * 10) / 10

          await supabase
            .from('politicians')
            .update({
              avg_rating: avg,
              total_ratings: remainingRatings.length
            })
            .eq('id', politicianId)
        } else {
          // 평가가 없으면 초기화
          await supabase
            .from('politicians')
            .update({
              avg_rating: 0,
              total_ratings: 0
            })
            .eq('id', politicianId)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `총 ${ratingsToDelete?.length || 0}개의 평가가 삭제되었습니다.`
    })

  } catch (error) {
    console.error('DELETE /api/ratings/my error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}