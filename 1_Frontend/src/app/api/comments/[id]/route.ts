// P3BA5: 댓글 수정/삭제 API
// 정치인 세션 토큰 지원 추가

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { validatePoliticianSession } from '@/lib/auth/politicianSession';

// 정치인 댓글 수정 스키마
const politicianUpdateSchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다').max(500, '댓글은 최대 500자까지 입력 가능합니다'),
  politician_id: z.string().length(8),
  session_token: z.string().length(64),
});

// 정치인 댓글 삭제 스키마
const politicianDeleteSchema = z.object({
  politician_id: z.string().length(8),
  session_token: z.string().length(64),
});

// 일반 회원 댓글 수정 스키마
const userUpdateSchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다').max(500, '댓글은 최대 500자까지 입력 가능합니다'),
});
/**
 * PATCH /api/comments/{id}
 * 댓글 수정 (회원 쿠키 인증 또는 정치인 세션 토큰)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const body = await request.json();

    // 정치인 세션 토큰이 있는 경우
    if (body.session_token && body.politician_id) {
      const validated = politicianUpdateSchema.parse(body);

      // 세션 토큰 검증
      const validationResult = await validatePoliticianSession(
        validated.politician_id,
        validated.session_token
      );

      if (!validationResult.valid) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 401 }
        );
      }

      // Admin client로 댓글 확인 및 수정
      const supabase: any = createAdminClient();

      // 댓글 조회 및 소유권 확인
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('id, politician_id, author_type')
        .eq('id', commentId)
        .single() as { data: { id: string; politician_id: string | null; author_type: string | null; user_id: string | null } | null; error: any };

      if (fetchError || !comment) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }

      // 정치인 본인 댓글인지 확인
      if (comment.politician_id !== validated.politician_id || comment.author_type !== 'politician') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '본인의 댓글만 수정할 수 있습니다.' } },
          { status: 403 }
        );
      }

      // 댓글 수정
      const { data: updatedComment, error: updateError } = await supabase
        .from('comments')
        .update({ content: validated.content, updated_at: new Date().toISOString() } as any)
        .eq('id', commentId)
        .select()
        .single();

      if (updateError) {
        console.error('[PATCH /api/comments] Update error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: '댓글 수정 중 오류가 발생했습니다.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedComment,
        message: '댓글이 수정되었습니다.',
      });
    }

    // 일반 회원 인증
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const validated = userUpdateSchema.parse(body);
    const supabase: any = await createClient();

    // 댓글 조회 및 소유권 확인
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '본인의 댓글만 수정할 수 있습니다.' } },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content: validated.content, updated_at: new Date().toISOString() } as any)
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '댓글 수정 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: '댓글이 수정되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '입력 데이터가 올바르지 않습니다.', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('[PATCH /api/comments] Error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다.' } }, { status: 500 });
  }
}

/**
 * DELETE /api/comments/{id}
 * 댓글 삭제 (회원 쿠키 인증 또는 정치인 세션 토큰)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    let body: any = {};

    // DELETE 요청 body 파싱 시도
    try {
      body = await request.json();
    } catch {
      // body가 없는 경우 - 쿠키 인증으로 진행
    }

    // 정치인 세션 토큰이 있는 경우
    if (body.session_token && body.politician_id) {
      const validated = politicianDeleteSchema.parse(body);

      // 세션 토큰 검증
      const validationResult = await validatePoliticianSession(
        validated.politician_id,
        validated.session_token
      );

      if (!validationResult.valid) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 401 }
        );
      }

      // Admin client로 댓글 확인 및 삭제
      const supabase: any = createAdminClient();

      // 댓글 조회 및 소유권 확인
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('id, politician_id, author_type')
        .eq('id', commentId)
        .single() as { data: { id: string; politician_id: string | null; author_type: string | null; user_id: string | null } | null; error: any };

      if (fetchError || !comment) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }

      // 정치인 본인 댓글인지 확인
      if (comment.politician_id !== validated.politician_id || comment.author_type !== 'politician') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '본인의 댓글만 삭제할 수 있습니다.' } },
          { status: 403 }
        );
      }

      // 댓글 삭제 (soft delete: is_deleted = true)
      const { error: deleteError } = await supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() } as any)
        .eq('id', commentId);

      if (deleteError) {
        console.error('[DELETE /api/comments] Delete error:', deleteError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: '댓글 삭제 중 오류가 발생했습니다.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { commentId },
        message: '댓글이 삭제되었습니다.',
      });
    }

    // 일반 회원 인증
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase: any = await createClient();

    // 댓글 조회 및 소유권 확인
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '본인의 댓글만 삭제할 수 있습니다.' } },
        { status: 403 }
      );
    }

    // 댓글 삭제 (soft delete: is_deleted = true)
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() } as any)
      .eq('id', commentId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '댓글 삭제 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { commentId },
      message: '댓글이 삭제되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '입력 데이터가 올바르지 않습니다.', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('[DELETE /api/comments] Error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다.' } }, { status: 500 });
  }
}
