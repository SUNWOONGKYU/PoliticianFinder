/**
 * Like Status Check API Route
 * 좋아요 상태 확인 API
 *
 * GET /api/likes/check - 특정 대상에 대한 좋아요 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LikeStatusResponse, LikeStatusApiResponse } from '@/types/community'

/**
 * GET /api/likes/check
 * 특정 대상에 대한 현재 사용자의 좋아요 상태 확인
 *
 * Query Parameters:
 * - target_id: 대상 ID
 * - target_type: 대상 타입 (rating, comment)
 *
 * Returns:
 * - is_liked: 현재 사용자가 좋아요를 눌렀는지 여부
 * - like_count: 전체 좋아요 개수
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const target_id = Number(searchParams.get('target_id'))
    const target_type = searchParams.get('target_type')

    // 입력 유효성 검증
    if (!target_id || isNaN(target_id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 대상 ID입니다.' },
        { status: 400 }
      )
    }

    const validTypes = ['rating', 'comment']
    if (!target_type || !validTypes.includes(target_type)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 좋아요 타입입니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자 확인 (선택적)
    const { data: { user } } = await supabase.auth.getUser()

    // 전체 좋아요 개수 조회
    const { count: likeCount, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', target_id)
      .eq('target_type', target_type)

    if (countError) {
      console.error('Like count error:', countError)
      return NextResponse.json(
        { success: false, error: '좋아요 개수 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 현재 사용자의 좋아요 여부 확인
    let isLiked = false
    if (user) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_id', target_id)
        .eq('target_type', target_type)
        .single()

      isLiked = !!userLike
    }

    const response: LikeStatusResponse = {
      is_liked: isLiked,
      like_count: likeCount || 0
    }

    // P4B3: 좋아요 상태 체크 - 사용자별로 다른 응답, private 캐싱 30초
    return NextResponse.json({
      success: true,
      data: response
    } as LikeStatusApiResponse, {
      headers: {
        'Cache-Control': user ? 'private, max-age=30' : 'public, max-age=30, s-maxage=60'
      }
    })

  } catch (error) {
    console.error('GET /api/likes/check error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}