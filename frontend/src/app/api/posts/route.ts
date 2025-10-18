import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Post, CreatePostDto, PostsResponse } from '@/types/post';

// 유효성 검사 스키마
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.enum(['general', 'politics', 'question', 'review']),
  politician_id: z.number().nullable().optional(),
  post_type: z.enum(['review', 'analysis', 'news', 'opinion']).optional().default('review'),
  status: z.enum(['draft', 'published']).optional().default('published'),
  excerpt: z.string().nullable().optional(),
  featured_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

/**
 * GET /api/posts - 게시글 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category');
    const politician_id = searchParams.get('politician_id');
    const sort = searchParams.get('sort') || 'latest';
    const is_hot = searchParams.get('is_hot');
    const is_pinned = searchParams.get('is_pinned');
    const search = searchParams.get('search');

    // 기본 쿼리 빌드
    let query = supabase
      .from('posts')
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
      `, { count: 'exact' })
      .eq('status', 'published');

    // 필터 적용
    if (category) {
      query = query.eq('category', category);
    }

    if (politician_id) {
      query = query.eq('politician_id', politician_id);
    }

    if (is_hot === 'true') {
      query = query.eq('is_hot', true);
    }

    if (is_pinned === 'true') {
      query = query.eq('is_pinned', true);
    }

    // 검색 적용
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 정렬 적용
    switch (sort) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'views':
        query = query.order('view_count', { ascending: false });
        break;
      case 'likes':
        query = query.order('like_count', { ascending: false });
        break;
      case 'latest':
      default:
        // 핀고정 글 우선, 그 다음 최신순
        query = query
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        break;
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // 응답 포맷팅
    const posts: Post[] = data?.map((post: any) => ({
      ...post,
      politician: post.politicians || null,
      author: post.profiles || null,
    })) || [];

    const response: PostsResponse = {
      data: posts,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts - 게시글 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 유효성 검사
    const validatedData = createPostSchema.parse(body);

    // User-Agent와 IP 주소 가져오기
    const userAgent = request.headers.get('user-agent') || null;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() :
               request.headers.get('x-real-ip') || null;

    // slug 생성 (제목을 기반으로)
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 250) + '-' + Date.now();

    // 게시글 생성
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...validatedData,
        user_id: user.id,
        slug,
        ip_address: ip,
        user_agent: userAgent,
        published_at: validatedData.status === 'published' ? new Date().toISOString() : null,
      })
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
      console.error('Error creating post:', error);

      // 중복 slug 에러 처리
      if (error.code === '23505' && error.message.includes('slug')) {
        // 타임스탬프를 다시 추가하여 재시도
        const retrySlug = slug + '-' + Math.random().toString(36).substring(2, 8);

        const { data: retryData, error: retryError } = await supabase
          .from('posts')
          .insert({
            ...validatedData,
            user_id: user.id,
            slug: retrySlug,
            ip_address: ip,
            user_agent: userAgent,
            published_at: validatedData.status === 'published' ? new Date().toISOString() : null,
          })
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

        if (retryError) {
          return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
          );
        }

        const post: Post = {
          ...retryData,
          politician: retryData.politicians || null,
          author: retryData.profiles || null,
        };

        return NextResponse.json(post, { status: 201 });
      }

      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    const post: Post = {
      ...data,
      politician: data.politicians || null,
      author: data.profiles || null,
    };

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error in POST /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}