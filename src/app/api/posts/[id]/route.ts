import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Post, UpdatePostDto } from '@/types/post';

// 유효성 검사 스키마
const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(['general', 'politics', 'question', 'review']).optional(),
  politician_id: z.number().nullable().optional(),
  post_type: z.enum(['review', 'analysis', 'news', 'opinion']).optional(),
  status: z.enum(['draft', 'published', 'hidden']).optional(),
  excerpt: z.string().nullable().optional(),
  featured_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id] - 게시글 상세 조회
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

    // 게시글 조회
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        politicians!left (
          id,
          name,
          party,
          description,
          image_url
        ),
        profiles!posts_user_id_fkey!left (
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('id', postId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 게시글이 비공개 상태인 경우 작성자만 볼 수 있도록 체크
    if (data.status !== 'published') {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== data.user_id) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
    }

    // 조회수 증가 (비동기로 처리)
    supabase.rpc('increment_post_view_count', { post_id: postId })
      .then(({ error }) => {
        if (error) {
          console.error('Error incrementing view count:', error);
        }
      });

    const post: Post = {
      ...data,
      politician: data.politicians || null,
      author: data.profiles || null,
    };

    return NextResponse.json(post);
  } catch (error) {
    console.error('Unexpected error in GET /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[id] - 게시글 수정
 */
export async function PUT(
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

    // 기존 게시글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (existingPost.user_id !== user.id) {
      // 관리자 권한 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only edit your own posts' },
          { status: 403 }
        );
      }
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 유효성 검사
    const validatedData = updatePostSchema.parse(body);

    // 게시글 업데이트
    const updateData: UpdatePostDto = {
      ...validatedData,
      edited_at: new Date().toISOString(),
    };

    // 작성자가 아닌 관리자가 수정하는 경우
    if (existingPost.user_id !== user.id) {
      (updateData as any).last_edited_by = user.id;
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        *,
        politicians!left (
          id,
          name,
          party
        ),
        profiles!posts_user_id_fkey!left (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    const post: Post = {
      ...data,
      politician: data.politicians || null,
      author: data.profiles || null,
    };

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error in PUT /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id] - 게시글 삭제
 */
export async function DELETE(
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

    // 기존 게시글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (existingPost.user_id !== user.id) {
      // 관리자 권한 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only delete your own posts' },
          { status: 403 }
        );
      }
    }

    // Soft delete: status를 'deleted'로 변경
    const { error } = await supabase
      .from('posts')
      .update({ status: 'deleted' })
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/posts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}