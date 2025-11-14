// Admin API - 콘텐츠 관리 (게시글 목록 조회)
// Service Role Key 사용으로 RLS 우회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const getPostsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

/**
 * GET /api/admin/content
 * 관리자용 게시글 목록 조회 (RLS 우회)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
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
        ),
        profiles:user_id (
          username,
          email
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // 검색 필터
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query.search}%,content.ilike.%${query.search}%`
      );
    }

    // 카테고리 필터
    if (query.category) {
      queryBuilder = queryBuilder.eq("category", query.category);
    }

    // 상태 필터 (moderation_status)
    if (query.status) {
      queryBuilder = queryBuilder.eq("moderation_status", query.status);
    }

    // 페이지네이션
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 데이터 가져오기
    const { data: posts, count, error } = await queryBuilder;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 목록 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: posts || [],
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
    console.error("GET /api/admin/content error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/content
 * 게시글 상태 업데이트 (승인/거부/삭제)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { post_id, moderation_status, admin_notes } = body;

    if (!post_id || !moderation_status) {
      return NextResponse.json(
        { success: false, error: "post_id and moderation_status are required" },
        { status: 400 }
      );
    }

    const { data: updatedPost, error } = await supabase
      .from("posts")
      .update({
        moderation_status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post_id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 업데이트 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPost }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/content error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/content
 * 게시글 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get("post_id");

    if (!post_id) {
      return NextResponse.json(
        { success: false, error: "post_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post_id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/admin/content error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
