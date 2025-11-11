// P3BA2: Real API - 정치인 목록 (Supabase + RLS)
// Supabase 연동 및 Full-text Search 지원

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const getPoliticiansQuerySchema = z.object({
  page: z.string().optional().default("1").transform(val => parseInt(val, 10) || 1),
  limit: z.string().optional().default("20").transform(val => parseInt(val, 10) || 20),
  search: z.string().optional().default(""),
  party: z.string().optional(),
  position: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  verified_only: z.enum(["true", "false"]).optional().transform(val => val === "true"),
  sort: z.string().optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

type GetPoliticiansQuery = z.infer<typeof getPoliticiansQuerySchema>;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || "",
      party: searchParams.get("party"),
      position: searchParams.get("position"),
      region: searchParams.get("region"),
      district: searchParams.get("district"),
      verified_only: searchParams.get("verified_only"),
      sort: searchParams.get("sort") || "name",
      order: searchParams.get("order") || "asc",
    };

    const query = getPoliticiansQuerySchema.parse(queryParams);

    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = createClient();

    // Supabase 쿼리 빌더 시작
    let queryBuilder = supabase
      .from("politicians")
      .select("*", { count: "exact" });

    // Full-text 검색 (이름, 영어 이름, 정당, 지역)
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.search}%,name_en.ilike.%${query.search}%,party.ilike.%${query.search}%,region.ilike.%${query.search}%,district.ilike.%${query.search}%`
      );
    }

    // 필터 적용
    if (query.party) {
      queryBuilder = queryBuilder.eq("party", query.party);
    }

    if (query.position) {
      queryBuilder = queryBuilder.eq("position", query.position);
    }

    if (query.region) {
      queryBuilder = queryBuilder.eq("region", query.region);
    }

    if (query.district) {
      queryBuilder = queryBuilder.eq("district", query.district);
    }

    if (query.verified_only) {
      queryBuilder = queryBuilder.not("verified_at", "is", null);
    }

    // 정렬 적용
    const isDescending = query.order === "desc";
    queryBuilder = queryBuilder.order(query.sort || "name", { ascending: !isDescending });

    // 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 데이터 가져오기
    const { data: politicians, count, error } = await queryBuilder;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: politicians || [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasMore: query.page < totalPages
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "유효하지 않은 쿼리 파라미터입니다.",
        details: error.errors
      }, { status: 400 });
    }

    console.error('[Politicians API] Error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Supabase 서버 클라이언트 생성
    const supabase = createClient();

    // 입력 검증 스키마
    const insertSchema = z.object({
      name: z.string().min(1, "이름은 필수입니다."),
      name_kana: z.string().optional(),
      name_english: z.string().optional(),
      birth_date: z.string().optional(),
      gender: z.enum(["M", "F", "O"]).optional(),
      political_party_id: z.number().optional(),
      position_id: z.number().optional(),
      constituency_id: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      twitter_handle: z.string().optional(),
      facebook_url: z.string().url().optional(),
      instagram_handle: z.string().optional(),
      profile_image_url: z.string().url().optional(),
      bio: z.string().optional(),
      is_active: z.boolean().optional().default(true),
    });

    const validated = insertSchema.parse(body);

    // Supabase에 정치인 데이터 삽입 (RLS 정책 준수)
    const { data: newPolitician, error } = await supabase
      .from("politicians")
      .insert(validated)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "정치인 데이터 생성 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newPolitician,
      message: "정치인이 성공적으로 생성되었습니다."
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "유효하지 않은 입력 데이터입니다.",
        details: error.errors
      }, { status: 400 });
    }

    console.error("POST error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
