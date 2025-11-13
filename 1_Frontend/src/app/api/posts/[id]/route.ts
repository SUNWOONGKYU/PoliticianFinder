// P1BA3: Mock API - 커뮤니티
// Supabase 연동: 게시글 상세 조회/수정/삭제

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Mock User UUID
const MOCK_USER_ID = "7f61567b-bbdf-427a-90a9-0ee060ef4595";

const updatePostSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").optional(),
  content: z.string().min(10, "내용은 최소 10자 이상이어야 합니다").optional(),
  category: z.string().optional(),
});

/**
 * GET /api/posts/[id]
 * 게시글 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Supabase 클라이언트 생성
    const supabase = createClient();

    // 게시글 조회
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        politicians:politician_id (
          name,
          position,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: '게시글 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 조회수 증가
    const { error: updateError } = await supabase
      .from('posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('조회수 업데이트 오류:', updateError);
      // 조회수 업데이트 실패는 치명적이지 않으므로 계속 진행
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...post,
          view_count: (post.view_count || 0) + 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id]
 * 게시글 수정 (작성자만)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validated = updatePostSchema.parse(body);

    // Supabase 클라이언트 생성
    const supabase = createClient();

    // 게시글 존재 여부 및 권한 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase query error:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: '게시글 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 권한 확인 (실제 환경에서는 JWT 토큰에서 user_id를 가져와야 함)
    if (existingPost.user_id !== MOCK_USER_ID) {
      return NextResponse.json(
        { success: false, error: '게시글 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: '게시글 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/posts/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * 게시글 삭제 (작성자/관리자만)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Supabase 클라이언트 생성
    const supabase = createClient();

    // 게시글 존재 여부 및 권한 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase query error:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: '게시글 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 권한 확인 (실제 환경에서는 JWT 토큰에서 user_id를 가져와야 함)
    if (existingPost.user_id !== MOCK_USER_ID) {
      return NextResponse.json(
        { success: false, error: '게시글 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 삭제 (실제 삭제)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '게시글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { postId: id },
        message: '게시글이 삭제되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
