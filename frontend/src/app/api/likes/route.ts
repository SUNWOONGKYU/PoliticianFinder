/**
 * Likes API Route (P4B4)
 * 좋아요 추가 및 삭제를 담당하는 API Route
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 취소
 *
 * RATE LIMITING (P4B4):
 * - POST/DELETE: 30 requests per minute (likes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '../notifications/route'
import { applyRateLimit } from '@/lib/ratelimit'
import type {
  CreateLikeRequest,
  DeleteLikeRequest,
  Like,
  ApiResponse,
  NotificationType
} from '@/types/community'

/**
 * POST /api/likes
 * 좋아요 추가
 *
 * - 인증 필수
 * - 중복 좋아요 방지
 * - 좋아요 대상(평가, 댓글)의 like_count 증가
 * - 대상 작성자에게 알림 발송
 */
export async function POST(request: NextRequest) {
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

    // P4B4: Rate limiting (30 requests per minute)
    const rateLimitResponse = await applyRateLimit(request, "likes", user.id)
    if (rateLimitResponse) return rateLimitResponse

    // Request body 파싱
    const body: CreateLikeRequest = await request.json()
    const { target_id, target_type } = body

    // 입력 유효성 검증
    if (!target_id || typeof target_id !== 'number') {
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

    // 중복 좋아요 확인
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_id', target_id)
      .eq('target_type', target_type)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: '이미 좋아요를 눌렀습니다.' },
        { status: 409 }
      )
    }

    // 대상 존재 여부 확인 및 정보 조회
    let targetData: any = null
    let targetUserId: string | null = null
    let notificationMessage: string = ''
    let notificationLink: string = ''

    if (target_type === 'rating') {
      // 평가 조회
      const { data: rating, error: ratingError } = await supabase
        .from('ratings')
        .select(`
          *,
          politician:politician_id (
            id,
            name
          )
        `)
        .eq('id', target_id)
        .single()

      if (ratingError || !rating) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 평가입니다.' },
          { status: 404 }
        )
      }

      targetData = rating
      targetUserId = rating.user_id
      notificationMessage = `회원님의 ${rating.politician?.name || '정치인'} 평가를 좋아합니다.`
      notificationLink = `/politicians/${rating.politician_id}#rating-${target_id}`

    } else if (target_type === 'comment') {
      // 댓글 조회
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .select(`
          *,
          politician:politician_id (
            id,
            name
          )
        `)
        .eq('id', target_id)
        .single()

      if (commentError || !comment) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 댓글입니다.' },
          { status: 404 }
        )
      }

      // 삭제된 댓글에는 좋아요 불가
      if (comment.status === 'deleted') {
        return NextResponse.json(
          { success: false, error: '삭제된 댓글에는 좋아요를 누를 수 없습니다.' },
          { status: 400 }
        )
      }

      targetData = comment
      targetUserId = comment.user_id
      notificationMessage = `회원님의 ${comment.politician?.name || '정치인'} 페이지 댓글을 좋아합니다.`
      notificationLink = `/politicians/${comment.politician_id}#comment-${target_id}`

      // 댓글의 like_count 증가
      await supabase
        .from('comments')
        .update({ like_count: comment.like_count + 1 })
        .eq('id', target_id)
    }

    // 자기 자신의 콘텐츠에는 좋아요 불가
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: '본인의 콘텐츠에는 좋아요를 누를 수 없습니다.' },
        { status: 400 }
      )
    }

    // 좋아요 생성
    const { data: newLike, error: insertError } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        target_id,
        target_type
      })
      .select()
      .single()

    if (insertError) {
      console.error('Like insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '좋아요 추가에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const username = profile?.username || '익명 사용자'

    // 대상 작성자에게 알림 발송
    if (targetUserId) {
      await createNotification(supabase, {
        user_id: targetUserId,
        type: 'like' as NotificationType,
        title: '새로운 좋아요',
        message: `${username}님이 ${notificationMessage}`,
        link: notificationLink,
        metadata: {
          like_id: newLike.id,
          target_id,
          target_type
        },
        sender_id: user.id
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: newLike as Like,
        message: '좋아요가 추가되었습니다.'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/likes error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/likes
 * 좋아요 취소
 *
 * Query Parameters:
 * - target_id: 대상 ID
 * - target_type: 대상 타입 (rating, comment)
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

    // P4B4: Rate limiting (30 requests per minute)
    const rateLimitResponse = await applyRateLimit(request, "likes", user.id)
    if (rateLimitResponse) return rateLimitResponse

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

    // 좋아요 조회
    const { data: like, error: fetchError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_id', target_id)
      .eq('target_type', target_type)
      .single()

    if (fetchError || !like) {
      return NextResponse.json(
        { success: false, error: '좋아요 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_id', target_id)
      .eq('target_type', target_type)

    if (deleteError) {
      console.error('Like delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: '좋아요 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 댓글인 경우 like_count 감소
    if (target_type === 'comment') {
      await supabase.rpc('decrement_like_count', {
        comment_id: target_id
      }).catch(err => {
        // RPC 함수가 없는 경우 직접 업데이트
        supabase
          .from('comments')
          .select('like_count')
          .eq('id', target_id)
          .single()
          .then(({ data }) => {
            if (data && data.like_count > 0) {
              supabase
                .from('comments')
                .update({ like_count: data.like_count - 1 })
                .eq('id', target_id)
            }
          })
      })
    }

    return NextResponse.json({
      success: true,
      message: '좋아요가 취소되었습니다.'
    } as ApiResponse<null>)

  } catch (error) {
    console.error('DELETE /api/likes error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}