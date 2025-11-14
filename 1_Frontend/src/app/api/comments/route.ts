// P1BA3: Mock API - 커뮤니티
// Supabase 연동: 댓글 목록 조회 및 작성

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock User UUID
const MOCK_USER_ID = "7f61567b-bbdf-427a-90a9-0ee060ef4595";

const createCommentSchema = z.object({
  post_id: z.string().min(1, "게시글 ID는 필수입니다"),
  content: z.string().min(1, "댓글 내용은 필수입니다").max(500, "댓글은 최대 500자까지 입력 가능합니다"),
  parent_id: z.string().optional().nullable(),
});

const getCommentsQuerySchema = z.object({
  post_id: z.string().optional(),
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
  search: z.string().optional(),
});

/**
 * POST /api/comments
 * 댓글 작성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', validated.post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 대댓글인 경우 부모 댓글 존재 여부 확인
    if (validated.parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', validated.parent_id)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { success: false, error: '부모 댓글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 댓글 ID 생성 (timestamp 기반)
    const commentId = `comment_${Date.now()}`;

    // Supabase에 댓글 삽입
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        post_id: validated.post_id,
        content: validated.content,
        user_id: MOCK_USER_ID,
        parent_id: validated.parent_id || null,
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: '댓글 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: newComment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments
 * 댓글 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      post_id: searchParams.get("post_id") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
    };

    const query = getCommentsQuerySchema.parse(queryParams);

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Supabase 쿼리 빌더 시작
    let queryBuilder = supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // post_id 필터 (선택적)
    if (query.post_id) {
      queryBuilder = queryBuilder.eq('post_id', query.post_id);
    }

    // search 필터 (선택적)
    if (query.search) {
      queryBuilder = queryBuilder.ilike('content', `%${query.search}%`);
    }

    // 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 데이터 가져오기
    const { data: comments, count, error } = await queryBuilder;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: '댓글 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: comments || [],
        pagination: { page: query.page, limit: query.limit, total, totalPages },
        timestamp: new Date().toISOString(),
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
    console.error('GET /api/comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
