// 정치인 댓글 API (간편 인증 후)
// GET /api/comments/politician?post_id=... - 정치인 댓글 조회
// POST /api/comments/politician - 정치인 댓글 작성
// politician_comments 테이블 사용 (회원 댓글과 분리)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const politicianCommentSchema = z.object({
  post_id: z.string().min(1, '게시글 ID는 필수입니다'),
  politician_id: z.string().min(1, '정치인 ID는 필수입니다'),
  content: z.string().min(1, '댓글 내용은 필수입니다').max(500, '댓글은 최대 500자까지 입력 가능합니다'),
});

/**
 * GET /api/comments/politician?post_id=...
 * 특정 게시글의 정치인 댓글 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'post_id는 필수입니다.',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // politician_comments 테이블에서 해당 게시글의 댓글 조회
    const { data: comments, error } = await supabase
      .from('politician_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET /api/comments/politician] Query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '댓글 조회 중 오류가 발생했습니다.',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comments || [],
      total: comments?.length || 0,
    });
  } catch (error) {
    console.error('[GET /api/comments/politician] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments/politician
 * 정치인 댓글 작성 (politician_comments 테이블에 저장)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증
    const validated = politicianCommentSchema.parse(body);

    // Admin client 사용 (RLS 우회)
    const supabase = createAdminClient();

    // 1. 정치인 존재 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', validated.politician_id)
      .single() as { data: { id: string; name: string } | null; error: any };

    if (politicianError || !politician) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '정치인 정보를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 2. 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', validated.post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '게시글을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 3. politician_comments 테이블에 댓글 삽입
    const { data: newComment, error: insertError } = await supabase
      .from('politician_comments')
      .insert({
        post_id: validated.post_id,
        politician_id: politician.id,
        politician_name: politician.name,
        content: validated.content,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/comments/politician] Insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '댓글 작성 중 오류가 발생했습니다.',
            details: insertError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newComment,
        message: `${politician.name}님의 댓글이 작성되었습니다.`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/comments/politician] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
