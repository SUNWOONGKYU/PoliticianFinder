/**
 * Individual Rating API Route
 * 개별 평가 수정 및 삭제를 담당하는 API Route
 *
 * PUT /api/ratings/[id] - 평가 수정 (본인만 가능)
 * DELETE /api/ratings/[id] - 평가 삭제 (본인만 가능)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  UpdateRatingRequest,
  Rating
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
      console.error('Failed to fetch ratings:', ratingsError)
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
        console.error('Failed to update politician stats:', updateError)
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
    console.error('Error updating average rating:', error)
  }
}

/**
 * PUT /api/ratings/[id]
 * 평가 수정
 *
 * - 인증 필수
 * - 본인이 작성한 평가만 수정 가능
 * - 수정 후 자동으로 평균 평점 업데이트
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const ratingId = params.id

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Request body 파싱
    const body: UpdateRatingRequest = await request.json()
    const { score, comment, category } = body

    // 입력 유효성 검증
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

    // 기존 평가 조회 및 권한 확인
    const { data: existingRating, error: fetchError } = await supabase
      .from('ratings')
      .select('user_id, politician_id')
      .eq('id', ratingId)
      .single()

    if (fetchError || !existingRating) {
      return NextResponse.json(
        { success: false, error: '평가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 확인
    if (existingRating.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '본인이 작성한 평가만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 평가 수정
    const updateData: any = {
      score,
      updated_at: new Date().toISOString()
    }

    // 선택적 필드 처리
    if (comment !== undefined) {
      updateData.comment = comment || null
    }
    if (category !== undefined) {
      updateData.category = category || 'overall'
    }

    const { data: updatedRating, error: updateError } = await supabase
      .from('ratings')
      .update(updateData)
      .eq('id', ratingId)
      .select()
      .single()

    if (updateError) {
      console.error('Rating update error:', updateError)
      return NextResponse.json(
        { success: false, error: '평가 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 평균 평점 업데이트 (비동기로 처리)
    updateAverageRating(supabase, existingRating.politician_id)

    return NextResponse.json({
      success: true,
      data: updatedRating as Rating,
      message: '평가가 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('PUT /api/ratings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ratings/[id]
 * 평가 삭제
 *
 * - 인증 필수
 * - 본인이 작성한 평가만 삭제 가능
 * - 삭제 후 자동으로 평균 평점 업데이트
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const ratingId = params.id

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 기존 평가 조회 및 권한 확인
    const { data: existingRating, error: fetchError } = await supabase
      .from('ratings')
      .select('user_id, politician_id')
      .eq('id', ratingId)
      .single()

    if (fetchError || !existingRating) {
      return NextResponse.json(
        { success: false, error: '평가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 확인
    if (existingRating.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '본인이 작성한 평가만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 평가 삭제
    const { error: deleteError } = await supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId)

    if (deleteError) {
      console.error('Rating delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: '평가 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 평균 평점 업데이트 (비동기로 처리)
    updateAverageRating(supabase, existingRating.politician_id)

    return NextResponse.json({
      success: true,
      message: '평가가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('DELETE /api/ratings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ratings/[id]
 * 개별 평가 조회
 *
 * - 인증 불필요 (공개 정보)
 * - 사용자 프로필 정보 포함
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const ratingId = params.id

    // 평가 조회 (사용자 프로필 포함)
    const { data: rating, error } = await supabase
      .from('ratings')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('id', ratingId)
      .single()

    if (error || !rating) {
      return NextResponse.json(
        { success: false, error: '평가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // P4B3: 개별 평가 - 1-2분 캐싱
    return NextResponse.json({
      success: true,
      data: rating
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'CDN-Cache-Control': 'max-age=120',
        'Vercel-CDN-Cache-Control': 'max-age=120'
      }
    })

  } catch (error) {
    console.error('GET /api/ratings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}