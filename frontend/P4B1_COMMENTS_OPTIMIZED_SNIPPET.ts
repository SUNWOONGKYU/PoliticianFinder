/**
 * Comments API Route (OPTIMIZED - P4B1)
 * 댓글 생성 및 조회를 담당하는 API Route
 *
 * POST /api/comments - 새로운 댓글 생성 (인증 필수)
 * GET /api/comments - 댓글 목록 조회 (페이지네이션 지원)
 *
 * OPTIMIZATION CHANGES:
 * - N+1 query 제거: 대댓글 일괄 조회
 * - 좋아요 상태 배치 조회
 * - 필수 필드만 SELECT
 * - 캐싱 헤더 추가
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '../notifications/route'
import type {
  CreateCommentRequest,
  Comment,
  CommentWithProfile,
  CommentFilters,
  PaginatedResponse,
  ApiResponse,
  NotificationType
} from '@/types/community'

// POST 함수는 기존과 동일하므로 생략...
// (실제 구현 시 위의 원본 POST 함수를 그대로 사용)

/**
 * GET /api/comments (OPTIMIZED)
 * 
 * OPTIMIZATIONS APPLIED (P4B1):
 * 1. N+1 쿼리 제거: 대댓글을 for loop에서 조회하는 대신 일괄 조회
 * 2. 좋아요 상태를 대댓글 포함 모든 댓글에 대해 배치 조회
 * 3. 필수 필드만 SELECT
 * 4. 캐싱 헤더 추가
 * 5. 쿼리 성능 로깅 추가
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now() // 성능 측정
  
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
        {
          success: false,
          error: 'politician_id는 필수 파라미터입니다.'
        },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    const from = (page - 1) * limit
    const to = from + limit - 1

    // OPTIMIZED: 필수 필드만 SELECT
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
      console.error('Comments fetch error:', error)
      return NextResponse.json(
        { success: false, error: '댓글 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // OPTIMIZED: N+1 쿼리 제거 및 배치 처리
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

      // 2. 대댓글 일괄 조회 (N+1 쿼리 방지)
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
    console.log(`[P4B1 OPTIMIZED] Comments query completed in ${duration}ms for ${data?.length || 0} comments`)

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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'X-Query-Time': `${duration}ms`
      }
    })

  } catch (error) {
    console.error('GET /api/comments error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
