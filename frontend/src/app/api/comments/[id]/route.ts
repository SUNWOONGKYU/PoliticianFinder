/**
 * Comment CRUD API Route (Individual)
 * 개별 댓글 수정 및 삭제 API
 *
 * PUT /api/comments/[id] - 댓글 수정 (작성자만 가능)
 * DELETE /api/comments/[id] - 댓글 삭제 (작성자만 가능)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  UpdateCommentRequest,
  Comment,
  ApiResponse
} from '@/types/community'

/**
 * PUT /api/comments/[id]
 * 댓글 수정
 *
 * - 작성자 본인만 수정 가능
 * - 내용만 수정 가능 (상태 변경은 관리자 기능)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const commentId = parseInt(params.id)

    // ID 유효성 검증
    if (!commentId || isNaN(commentId)) {
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
    const body: UpdateCommentRequest = await request.json()
    const { content } = body

    // 입력 유효성 검증
    if (content !== undefined) {
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
    }

    // 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작성자 확인
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '댓글 수정 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 삭제된 댓글은 수정 불가
    if (comment.status === 'deleted') {
      return NextResponse.json(
        { success: false, error: '삭제된 댓글은 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 댓글 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (content !== undefined) {
      updateData.content = content.trim()
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single()

    if (updateError) {
      console.error('Comment update error:', updateError)
      return NextResponse.json(
        { success: false, error: '댓글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedComment as Comment,
      message: '댓글이 성공적으로 수정되었습니다.'
    } as ApiResponse<Comment>)

  } catch (error) {
    console.error('PUT /api/comments/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/comments/[id]
 * 댓글 삭제
 *
 * - 작성자 본인만 삭제 가능
 * - 실제로 삭제하지 않고 상태만 변경 (soft delete)
 * - 대댓글이 있는 경우 "삭제된 댓글입니다" 표시
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const commentId = parseInt(params.id)

    // ID 유효성 검증
    if (!commentId || isNaN(commentId)) {
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

    // 댓글 조회 및 작성자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작성자 확인
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '댓글 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 삭제된 댓글인 경우
    if (comment.status === 'deleted') {
      return NextResponse.json(
        { success: false, error: '이미 삭제된 댓글입니다.' },
        { status: 400 }
      )
    }

    // 대댓글이 있는 경우 확인
    const { count: replyCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', commentId)
      .eq('status', 'active')

    // Soft delete 수행
    const updateData = {
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      // 대댓글이 있는 경우 내용을 유지하고 상태만 변경
      // 대댓글이 없는 경우 내용도 변경
      content: replyCount && replyCount > 0 ? comment.content : '삭제된 댓글입니다.'
    }

    const { data: deletedComment, error: deleteError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single()

    if (deleteError) {
      console.error('Comment delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: '댓글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 부모 댓글의 reply_count 감소 (대댓글인 경우)
    if (comment.parent_id) {
      await supabase.rpc('decrement_reply_count', {
        comment_id: comment.parent_id
      }).catch(err => {
        // RPC 함수가 없는 경우 직접 업데이트
        supabase
          .from('comments')
          .update({ reply_count: comment.reply_count - 1 })
          .eq('id', comment.parent_id)
          .gte('reply_count', 1)
      })
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 성공적으로 삭제되었습니다.'
    } as ApiResponse<null>)

  } catch (error) {
    console.error('DELETE /api/comments/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}