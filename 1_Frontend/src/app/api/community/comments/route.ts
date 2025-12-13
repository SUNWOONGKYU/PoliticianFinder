// 커뮤니티 댓글 API
// GET /api/community/comments?user_id={userId}&limit={limit}
// 사용자별 댓글 목록 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 댓글과 게시글 정보 함께 조회
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        like_count,
        post_id,
        posts (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      upvotes: comment.like_count || 0,
      downvotes: 0,
      post_id: comment.post_id,
      post_title: comment.posts?.title || '삭제된 게시글',
    }));

    return NextResponse.json({
      success: true,
      data: formattedComments,
    });
  } catch (error) {
    console.error('GET /api/community/comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
