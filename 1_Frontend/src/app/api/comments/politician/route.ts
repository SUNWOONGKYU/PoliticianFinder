// 정치인 댓글 작성 API (간편 인증 후)
// POST /api/comments/politician

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const politicianCommentSchema = z.object({
  post_id: z.string().min(1, '게시글 ID는 필수입니다'),
  politician_id: z.string().min(1, '정치인 ID는 필수입니다'),
  content: z.string().min(1, '댓글 내용은 필수입니다').max(500, '댓글은 최대 500자까지 입력 가능합니다'),
  parent_id: z.string().optional().nullable(),
});

/**
 * POST /api/comments/politician
 * 정치인 댓글 작성 (간편 인증 완료 후 호출)
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

    // 3. 대댓글인 경우 부모 댓글 존재 여부 확인
    if (validated.parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', validated.parent_id)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '부모 댓글을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        );
      }
    }

    // 4. 댓글 삽입 (정치인 댓글은 user_id가 null)
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: validated.post_id,
        user_id: null,
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
