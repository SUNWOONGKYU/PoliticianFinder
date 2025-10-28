/**
 * Comments API Route (OPTIMIZED - P4B2, P4B4)
 * 댓글 생성 및 조회를 담당하는 API Route
 *
 * POST /api/comments - 새로운 댓글 생성 (인증 필수)
 * GET /api/comments - 댓글 목록 조회 (페이지네이션 지원)
 *
 * OPTIMIZATION CHANGES (P4B2):
 * - N+1 query 제거: 대댓글 일괄 조회
 * - 좋아요 상태 배치 조회
 * - 필수 필드만 SELECT
 * - 캐싱 헤더 추가
 *
 * RATE LIMITING (P4B4):
 * - POST: 10 requests per minute (userAction)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '../notifications/route'
import { applyRateLimit } from '@/lib/ratelimit'
import { logger, logSupabaseError, logPerformance } from '@/lib/logger'
import type {
  CreateCommentRequest,
  Comment,
  CommentWithProfile,
  CommentFilters,
  PaginatedResponse,
  ApiResponse,
  NotificationType
} from '@/types/community'

/**
 * POST /api/comments
 * 새로운 댓글 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized comment creation attempt', {
        endpoint: '/api/comments',
        method: 'POST',
        errorCode: 'AUTH_REQUIRED',
        statusCode: 401
      })
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // P4B4: Rate limiting (10 requests per minute)
    const rateLimitResponse = await applyRateLimit(request, "userAction", user.id)
    if (rateLimitResponse) return rateLimitResponse

    const body: CreateCommentRequest = await request.json()
    const { politician_id, content, parent_id } = body

    if (!politician_id || typeof politician_id !== 'number') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 정치인 ID입니다.' },
        { status: 400 }
      )
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: '댓글은 1000자를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', politician_id)
      .single()

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 정치인입니다.' },
        { status: 404 }
      )
    }

    let depth = 0
    let parentComment = null
    if (parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from('comments')
        .select('id, user_id, depth, content')
        .eq('id', parent_id)
        .eq('politician_id', politician_id)
        .single()

      if (parentError || !parent) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 부모 댓글입니다.' },
          { status: 404 }
        )
      }

      if (parent.depth >= 1) {
        return NextResponse.json(
          { success: false, error: '대댓글의 대댓글은 작성할 수 없습니다.' },
          { status: 400 }
        )
      }

      parentComment = parent
      depth = parent.depth + 1

      await supabase
        .from('comments')
        .update({ reply_count: parent.reply_count + 1 })
        .eq('id', parent_id)
    }

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        politician_id,
        user_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
        status: 'active',
        like_count: 0,
        reply_count: 0,
        depth
      })
      .select()
      .single()

    if (insertError) {
      logSupabaseError('comments', 'insert', insertError, user.id)
      return NextResponse.json(
        { success: false, error: '댓글 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const username = profile?.username || '익명 사용자'

    if (parentComment) {
      if (parentComment.user_id !== user.id) {
        await createNotification(supabase, {
          user_id: parentComment.user_id,
          type: 'reply' as NotificationType,
          title: '새로운 답글',
          message: `${username}님이 회원님의 댓글에 답글을 남겼습니다.`,
          link: `/politicians/${politician_id}#comment-${newComment.id}`,
          metadata: {
            comment_id: newComment.id,
            politician_id,
            parent_comment_id: parent_id
          },
          sender_id: user.id
        })
      }
    }

    logger.info('Comment created successfully', {
      endpoint: '/api/comments',
      method: 'POST',
      userId: user.id,
      metadata: { politician_id, parent_id, depth }
    })

    return NextResponse.json(
      {
        success: true,
        data: newComment as Comment,
        message: '댓글이 성공적으로 작성되었습니다.'
      },
      { status: 201 }
    )

  } catch (error) {
    logger.error('POST /api/comments error', {
      endpoint: '/api/comments',
      method: 'POST',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/comments (OPTIMIZED - P4B2)
 * N+1 쿼리 문제 해결
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const politician_id = searchParams.get('politician_id')
    const parent_id = searchParams.get('parent_id')
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!politician_id) {
      return NextResponse.json(
        { success: false, error: 'politician_id는 필수 파라미터입니다.' },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 필수 필드만 SELECT
    let query = supabase
      .from('comments')
      .select(`
        id,
        politician_id,
        user_id,
        parent_id,
        content,
        status,
        like_count,
        reply_count,
        depth,
        created_at,
        updated_at,
        profiles:user_id (
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('politician_id', politician_id)
      .eq('status', 'active')

    if (parent_id === 'null' || parent_id === '0') {
      query = query.is('parent_id', null)
    } else if (parent_id) {
      query = query.eq('parent_id', parent_id)
    }

    const validSortFields = ['created_at', 'like_count', 'reply_count']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logSupabaseError('comments', 'select', error)
      return NextResponse.json(
        { success: false, error: '댓글 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // N+1 쿼리 제거 - 일괄 처리
    let enrichedData: CommentWithProfile[] = []
    if (data && data.length > 0) {
      // 1. 좋아요 상태 확인 (메인 댓글)
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

      // 2. 대댓글 일괄 조회 (N+1 방지!)
      const parentCommentIds = data
        .filter(c => !c.parent_id && c.reply_count > 0)
        .map(c => c.id)

      let repliesMap = new Map<number, any[]>()
      if (parentCommentIds.length > 0) {
        const { data: allReplies } = await supabase
          .from('comments')
          .select(`
            id,
            politician_id,
            user_id,
            parent_id,
            content,
            status,
            like_count,
            reply_count,
            depth,
            created_at,
            updated_at,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .in('parent_id', parentCommentIds)
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (allReplies) {
          // 대댓글을 parent_id별로 그룹화
          allReplies.forEach(reply => {
            if (!repliesMap.has(reply.parent_id)) {
              repliesMap.set(reply.parent_id, [])
            }
            repliesMap.get(reply.parent_id)!.push(reply)
          })

          // 3. 대댓글 좋아요 상태 일괄 확인
          if (user && allReplies.length > 0) {
            const replyIds = allReplies.map(r => r.id)
            const { data: replyLikes } = await supabase
              .from('likes')
              .select('target_id')
              .eq('user_id', user.id)
              .eq('target_type', 'comment')
              .in('target_id', replyIds)

            if (replyLikes) {
              replyLikes.forEach(like => likedComments.add(like.target_id))
            }
          }
        }
      }

      // 4. 댓글 데이터 구성
      enrichedData = data.map(comment => {
        const enrichedComment: CommentWithProfile = {
          ...comment,
          is_liked: likedComments.has(comment.id)
        }

        if (!comment.parent_id && comment.reply_count > 0) {
          const replies = repliesMap.get(comment.id) || []
          enrichedComment.replies = replies
            .slice(0, 5)
            .map(reply => ({
              ...reply,
              is_liked: likedComments.has(reply.id)
            }))
        }

        return enrichedComment
      })
    }

    const duration = Date.now() - startTime
    logPerformance('/api/comments', duration)

    const response: PaginatedResponse<CommentWithProfile> = {
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

    // P4B3: 댓글 목록 - 30초-1분 캐싱
    return NextResponse.json({
      success: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'CDN-Cache-Control': 'max-age=60',
        'Vercel-CDN-Cache-Control': 'max-age=60',
        'X-Query-Time': `${duration}ms`
      }
    })

  } catch (error) {
    logger.error('GET /api/comments error', {
      endpoint: '/api/comments',
      method: 'GET',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
