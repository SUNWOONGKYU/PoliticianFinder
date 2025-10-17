/**
 * Comment Replies API Route
 * 대댓글 생성 및 조회 API
 *
 * POST /api/comments/[id]/replies - 대댓글 생성
 * GET /api/comments/[id]/replies - 특정 댓글의 모든 대댓글 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateReplyRequest,
  Comment,
  CommentWithProfile,
  PaginatedResponse,
  ApiResponse,
  NotificationType
} from '@/types/community'

/**
 * POST /api/comments/[id]/replies
 * 대댓글 생성
 *
 * - 인증 필수
 * - 원댓글에만 대댓글 작성 가능 (depth 제한)
 * - 부모 댓글 작성자에게 알림 발송
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const parentId = parseInt(params.id)

    // ID 유효성 검증
    if (!parentId || isNaN(parentId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 댓글 ID입니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Request body 파싱
    const body: CreateReplyRequest = await request.json()
    const { content, politician_id } = body

    // 입력 유효성 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '대댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: '대댓글은 1000자를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    if (!politician_id || typeof politician_id !== 'number') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 정치인 ID입니다.' },
        { status: 400 }
      )
    }

    // 부모 댓글 조회
    const { data: parentComment, error: parentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', parentId)
      .eq('politician_id', politician_id)
      .single()

    if (parentError || !parentComment) {
      return NextResponse.json(
        { success: false, error: '부모 댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 삭제된 댓글에는 대댓글 작성 불가
    if (parentComment.status === 'deleted') {
      return NextResponse.json(
        { success: false, error: '삭제된 댓글에는 답글을 작성할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 댓글 깊이 확인 (대댓글의 대댓글 방지)
    if (parentComment.depth >= 1) {
      return NextResponse.json(
        { success: false, error: '대댓글에는 답글을 작성할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 대댓글 생성
    const { data: newReply, error: insertError } = await supabase
      .from('comments')
      .insert({
        politician_id,
        user_id: user.id,
        parent_id: parentId,
        content: content.trim(),
        status: 'active',
        like_count: 0,
        reply_count: 0,
        depth: 1
      })
      .select()
      .single()

    if (insertError) {
      console.error('Reply insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '대댓글 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 부모 댓글의 reply_count 증가
    await supabase
      .from('comments')
      .update({ reply_count: parentComment.reply_count + 1 })
      .eq('id', parentId)

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const username = profile?.username || '익명 사용자'

    // 정치인 정보 조회
    const { data: politician } = await supabase
      .from('politicians')
      .select('name')
      .eq('id', politician_id)
      .single()

    // 부모 댓글 작성자에게 알림 발송 (본인 제외)

    return NextResponse.json(
      {
        success: true,
        data: newReply as Comment,
        message: '답글이 성공적으로 작성되었습니다.'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/comments/[id]/replies error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/comments/[id]/replies
 * 특정 댓글의 모든 대댓글 조회
 *
 * Query Parameters:
 * - page (optional): 페이지 번호 (기본값: 1)
 * - limit (optional): 페이지당 항목 수 (기본값: 10, 최대: 50)
 * - sortOrder (optional): 정렬 순서 (asc, desc)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const parentId = parseInt(params.id)

    // ID 유효성 검증
    if (!parentId || isNaN(parentId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 댓글 ID입니다.' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // 현재 사용자 확인 (좋아요 상태 체크용)
    const { data: { user } } = await supabase.auth.getUser()

    // 페이지네이션 계산
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 대댓글 조회
    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('parent_id', parentId)
      .eq('status', 'active')
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      console.error('Replies fetch error:', error)
      return NextResponse.json(
        { success: false, error: '대댓글 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 좋아요 상태 확인
    let enrichedData: CommentWithProfile[] = []
    if (data && data.length > 0) {
      let likedComments = new Set<number>()

      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'comment')
          .in('target_id', data.map(c => c.id))

        if (likes) {
          likedComments = new Set(likes.map(l => l.target_id))
        }
      }

      enrichedData = data.map(reply => ({
        ...reply,
        is_liked: likedComments.has(reply.id)
      }))
    }

    // 응답 구성
    const response: PaginatedResponse<CommentWithProfile> = {
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('GET /api/comments/[id]/replies error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}