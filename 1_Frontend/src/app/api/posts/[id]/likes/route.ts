// P3BA3: Real API - 게시글 좋아요 토글
// Supabase RLS 연동: 좋아요 추가/제거

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

/**
 * POST /api/posts/[id]/likes
 * 게시글 좋아요 토글 (인증 필요)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;

    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = await createClient();

    // 2. 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // 3. 기존 좋아요 확인
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('[POST /api/posts/[id]/likes] Check error:', likeCheckError);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '좋아요 조회 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    let isLiked = false;

    if (existingLike) {
      // 좋아요 제거
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[POST /api/posts/[id]/likes] Delete error:', deleteError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: '좋아요 제거 중 오류가 발생했습니다.' } },
          { status: 500 }
        );
      }

      isLiked = false;
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('[POST /api/posts/[id]/likes] Insert error:', insertError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: '좋아요 추가 중 오류가 발생했습니다.' } },
          { status: 500 }
        );
      }

      isLiked = true;
    }

    // 4. 업데이트된 upvote/downvote 수 조회
    const { data: updatedPost, error: countError } = await supabase
      .from('posts')
      .select('upvotes, downvotes')
      .eq('id', postId)
      .single();

    const upvoteCount = updatedPost?.upvotes || 0;
    const downvoteCount = updatedPost?.downvotes || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          postId,
          isLiked,
          upvoteCount,
          downvoteCount,
        },
        message: isLiked ? '좋아요가 추가되었습니다.' : '좋아요가 제거되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/posts/[id]/likes] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
