// Community API - 게시글 목록 조회 (RLS 우회)
// Service Role Key 사용으로 승인된 모든 게시글 조회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getPostsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
  category: z.string().optional(),
  has_politician: z.string().optional(),
  sort: z.string().optional().default("-created_at"),
});

/**
 * GET /api/community/posts
 * 커뮤니티 게시글 목록 조회 (RLS 우회, 승인된 게시글만)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      category: searchParams.get("category") || undefined,
      has_politician: searchParams.get("has_politician") || undefined,
      sort: searchParams.get("sort") || "-created_at",
    };

    const query = getPostsQuerySchema.parse(queryParams);

    // Service Role Key로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 쿼리 빌더 시작
    let queryBuilder = supabase
      .from("posts")
      .select(`
        *,
        politicians:politician_id (
          name,
          position,
          status
        )
      `, { count: "exact" })
      // 승인된 게시글만 조회
      .eq("moderation_status", "approved");

    // 카테고리 필터
    if (query.category && query.category !== 'all') {
      queryBuilder = queryBuilder.eq("category", query.category);
    }

    // politician_id 필터
    if (query.has_politician === 'true') {
      // politician_id가 null이 아닌 게시글만
      queryBuilder = queryBuilder.not("politician_id", "is", null);
    } else if (query.has_politician === 'false') {
      // politician_id가 null인 게시글만
      queryBuilder = queryBuilder.is("politician_id", null);
    }

    // 정렬 적용
    const sortKey = query.sort.startsWith("-") ? query.sort.substring(1) : query.sort;
    const isDescending = query.sort.startsWith("-");
    queryBuilder = queryBuilder.order(sortKey as any, { ascending: !isDescending });

    // 페이지네이션
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 데이터 가져오기
    const { data: posts, count, error } = await queryBuilder;

    if (error) {
      console.error("[GET /api/community/posts] Supabase query error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 목록 조회 중 오류가 발생했습니다.',
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
        data: posts || [],
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
    console.error("[GET /api/community/posts] Unexpected error:", error);
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
