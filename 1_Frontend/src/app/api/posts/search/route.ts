// P3BA3: Real API - 게시글 검색
// PostgreSQL 전체 텍스트 검색 (한국어)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const searchQuerySchema = z.object({
  q: z.string().min(1, "검색어는 최소 1자 이상이어야 합니다").max(100),
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number).refine(val => val >= 1 && val <= 100),
  category: z.string().optional(),
});

/**
 * GET /api/posts/search
 * 게시글 전체 텍스트 검색 (한국어)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      q: searchParams.get("q") || "",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      category: searchParams.get("category") || undefined,
    };

    const query = searchQuerySchema.parse(queryParams);

    const supabase = createClient();

    // 2. 전체 텍스트 검색 쿼리 (PostgreSQL to_tsvector)
    let queryBuilder = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('moderation_status', 'approved')
      .or(`title.ilike.%${query.q}%,content.ilike.%${query.q}%`);

    // 3. 카테고리 필터
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    // 4. 정렬 (관련도 순 → 최신순)
    queryBuilder = queryBuilder
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    // 5. 페이지네이션
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 6. 데이터 가져오기
    const { data: posts, count, error } = await queryBuilder;

    if (error) {
      console.error('[GET /api/posts/search] Query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '검색 중 오류가 발생했습니다.' } },
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
        query: query.q,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '검색 파라미터가 올바르지 않습니다.', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('[GET /api/posts/search] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
