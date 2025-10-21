import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PostLikeResponse } from '@/types/post';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/like - 게시글 좋아요 토글
 *
 * 인증된 사용자만 좋아요 가능
 * 이미 좋아요한 경우 취소, 아닌 경우 추가
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

    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, like_count')
      .eq('id', postId)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 좋아요 토글 (RPC 함수 호출)
    const { data, error: rpcError } = await supabase.rpc('toggle_post_like', {
      p_post_id: postId,
      p_user_id: user.id
    });

    if (rpcError) {
      console.error('Error toggling like:', rpcError);
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      );
    }

    // 응답 데이터 파싱
    const response: PostLikeResponse = {
      liked: data?.liked || false,
      message: data?.message || 'Like toggled',
      like_count: post.like_count + (data?.liked ? 1 : -1),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in POST /api/posts/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[id]/like - 현재 사용자의 좋아요 상태 확인
 */
export async function GET(
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

    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        liked: false,
        authenticated: false
      });
    }

    // likes 테이블 확인 (테이블이 있는 경우에만)
    const { data: likeData, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    // 테이블이 없거나 에러가 발생한 경우
    if (likeError && !likeError.message.includes('relation')) {
      console.error('Error checking like status:', likeError);
    }

    return NextResponse.json({
      liked: !!likeData,
      authenticated: true
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/posts/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}