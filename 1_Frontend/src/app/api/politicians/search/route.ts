// P3BA2: Real API - 정치인 검색 (Full-text Search)
// 한국어 이름, 한자, 영문 이름, 약력 전체 텍스트 검색

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const searchQuerySchema = z.object({
  q: z.string().min(1, "검색어는 최소 1자 이상이어야 합니다."),
  type: z.enum(["name", "bio", "all"]).optional().default("all"),
  limit: z.string().optional().default("10").transform(Number),
  political_party_id: z.string().optional().transform(val => val ? Number(val) : undefined),
  position_id: z.string().optional().transform(val => val ? Number(val) : undefined),
  constituency_id: z.string().optional().transform(val => val ? Number(val) : undefined),
  verified_only: z.enum(["true", "false"]).optional().transform(val => val === "true"),
  is_active: z.enum(["true", "false"]).optional().transform(val => val === "true"),
});

type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * GET /api/politicians/search?q=검색어&type=all&limit=10
 * 정치인 전체 텍스트 검색
 * - 이름 (한국어, 한자, 영문)
 * - 약력
 * - 필터링 지원 (정당, 직책, 지역구)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      q: searchParams.get("q") || "",
      type: searchParams.get("type"),
      limit: searchParams.get("limit") || "10",
      political_party_id: searchParams.get("political_party_id"),
      position_id: searchParams.get("position_id"),
      constituency_id: searchParams.get("constituency_id"),
      verified_only: searchParams.get("verified_only"),
      is_active: searchParams.get("is_active"),
    };

    const query = searchQuerySchema.parse(queryParams);

    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = await createClient();

    // Supabase 쿼리 빌더 시작
    let queryBuilder = supabase
      .from("politicians")
      .select("*", { count: "exact" })
      .eq("is_active", query.is_active ?? true);

    // 검색어 기반 필터링 (Full-text search)
    if (query.type === "name") {
      // 이름 필드만 검색 (한국어, 한자, 영문)
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.q}%,name_kana.ilike.%${query.q}%,name_english.ilike.%${query.q}%`
      );
    } else if (query.type === "bio") {
      // 약력 필드만 검색
      queryBuilder = queryBuilder.ilike("bio", `%${query.q}%`);
    } else {
      // type === "all": 모든 텍스트 필드 검색
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.q}%,name_kana.ilike.%${query.q}%,name_english.ilike.%${query.q}%,bio.ilike.%${query.q}%`
      );
    }

    // 추가 필터 적용
    if (query.political_party_id !== undefined) {
      queryBuilder = queryBuilder.eq("political_party_id", query.political_party_id);
    }

    if (query.position_id !== undefined) {
      queryBuilder = queryBuilder.eq("position_id", query.position_id);
    }

    if (query.constituency_id !== undefined) {
      queryBuilder = queryBuilder.eq("constituency_id", query.constituency_id);
    }

    if (query.verified_only) {
      queryBuilder = queryBuilder.not("verified_at", "is", null);
    }

    // 결과 제한 및 정렬 (이름순)
    queryBuilder = queryBuilder
      .order("name", { ascending: true })
      .limit(query.limit);

    // 데이터 가져오기
    const { data: results, count, error } = await queryBuilder;

    if (error) {
      console.error("Supabase search error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "검색 중 오류가 발생했습니다.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: results || [],
        total: count || 0,
        query: {
          q: query.q,
          type: query.type,
          limit: query.limit,
          filters: {
            political_party_id: query.political_party_id,
            position_id: query.position_id,
            constituency_id: query.constituency_id,
            verified_only: query.verified_only,
            is_active: query.is_active ?? true,
          }
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
          error: "유효하지 않은 검색 파라미터입니다.",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("GET /api/politicians/search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
