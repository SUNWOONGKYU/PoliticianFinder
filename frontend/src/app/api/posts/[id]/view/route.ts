import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/view - 게시글 조회수 증가
 *
 * 클라이언트에서 명시적으로 호출할 수 있는 조회수 증가 엔드포인트
 * 중복 조회 방지를 위한 세션 기반 체크 가능
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, view_count')
      .eq('id', postId)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 조회수 증가 (RPC 함수 호출)
    const { error: rpcError } = await supabase.rpc('increment_post_view_count', {
      post_id: postId
    });

    if (rpcError) {
      console.error('Error incrementing view count:', rpcError);
      return NextResponse.json(
        { error: 'Failed to increment view count' },
        { status: 500 }
      );
    }

    // 업데이트된 조회수 반환
    const newViewCount = post.view_count + 1;

    return NextResponse.json({
      success: true,
      view_count: newViewCount,
      message: 'View count incremented'
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/posts/[id]/view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}