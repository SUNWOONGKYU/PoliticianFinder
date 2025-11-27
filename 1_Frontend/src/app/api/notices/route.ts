// Notices API - 공지사항 관리 (페이지네이션 지원)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const getNoticesQuerySchema = z.object({
  page: z.string().nullable().optional().default("1").transform(Number),
  limit: z.string().nullable().optional().default("10").transform(Number),
  search: z.string().nullable().optional().default(""),
});

// GET /api/notices - 공지사항 목록 조회 (페이지네이션 지원)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || "",
    };

    const query = getNoticesQuerySchema.parse(queryParams);

    // 쿼리 빌더 시작
    let queryBuilder = supabase
      .from("notices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // 검색 필터
    if (query.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,content.ilike.%${query.search}%`);
    }

    // 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    const { data, count, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching notices:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasMore: query.page < totalPages
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "유효하지 않은 쿼리 파라미터입니다.",
        details: error.errors
      }, { status: 400 });
    }

    console.error("GET /api/notices error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/notices - 공지사항 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { title, content, author_id } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "제목과 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notices")
      .insert({
        title,
        content,
        author_id: author_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notice:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notices error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notices - 공지사항 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("notices").delete().eq("id", id);

    if (error) {
      console.error("Error deleting notice:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DELETE /api/notices error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
