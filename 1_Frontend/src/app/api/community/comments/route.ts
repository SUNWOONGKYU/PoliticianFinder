// 커뮤니티 댓글 API
// GET /api/community/comments?user_id={userId}&limit={limit}
// 사용자별 댓글 목록 조회

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

    // RLS 우회를 위해 adminClient 사용
    const supabase = createAdminClient();

    // 먼저 댓글만 조회 (posts 조인 없이)
    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, content, created_at, like_count, post_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: Array<{ id: string; content: string; created_at: string; like_count: number; post_id: number }> | null; error: any };

    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }

    // 게시글 제목 별도 조회
    const postIds = [...new Set((comments || []).map(c => c.post_id).filter(Boolean))];
    let postsMap: Record<number, string> = {};

    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title')
        .in('id', postIds) as { data: Array<{ id: number; title: string }> | null };

      if (posts) {
        postsMap = posts.reduce((acc, post) => {
          acc[post.id] = post.title;
          return acc;
        }, {} as Record<number, string>);
      }
    }

    // 응답 형식 변환
    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      upvotes: comment.like_count || 0,
      downvotes: 0,
      post_id: comment.post_id,
      post_title: postsMap[comment.post_id] || '삭제된 게시글',
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
