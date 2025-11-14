// P1BA3: Real API - 커뮤니티 댓글
// Supabase RLS 연동: 실제 인증 사용자 기반 댓글 CRUD

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";

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
 * 댓글 작성 (인증 필요)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. 요청 데이터 검증
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // 3. Supabase 클라이언트 생성
    const supabase = createClient();

    // 4. 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('community_posts')
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

    // 5. 대댓글인 경우 부모 댓글 존재 여부 확인
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

    // 6. Supabase에 댓글 삽입 (RLS로 user_id 자동 검증)
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        post_id: validated.post_id,
        content: validated.content,
        user_id: user.id,
        parent_id: validated.parent_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/comments] Supabase insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '댓글 작성 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newComment,
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
    console.error('[POST /api/comments] Unexpected error:', error);
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

/**
 * GET /api/comments
 * 댓글 목록 조회 (인증 선택적)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      post_id: searchParams.get("post_id") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
    };

    const query = getCommentsQuerySchema.parse(queryParams);

    // 2. Supabase 클라이언트 생성
    const supabase = createClient();

    // 3. Supabase 쿼리 빌더 시작 (profiles와 community_posts 조인 추가)
    let queryBuilder = supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          username,
          email
        ),
        community_posts:post_id (
          title
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 4. post_id 필터 (선택적)
    if (query.post_id) {
      queryBuilder = queryBuilder.eq('post_id', query.post_id);
    }

    // 5. search 필터 (선택적)
    if (query.search) {
      queryBuilder = queryBuilder.ilike('content', `%${query.search}%`);
    }

    // 6. 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 7. 데이터 가져오기
    const { data: comments, count, error } = await queryBuilder;

    if (error) {
      console.error('[GET /api/comments] Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '댓글 목록 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: comments || [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    console.error('[GET /api/comments] Unexpected error:', error);
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
