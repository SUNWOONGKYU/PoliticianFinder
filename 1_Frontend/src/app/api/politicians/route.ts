// P3BA2: Real API - 정치인 목록 (Supabase + RLS)
// Supabase 연동 및 Full-text Search 지원
// P3F4: Field mapping for list view
// P3BA34: V24.0 AI 점수 통합 - ai_final_scores 테이블 연동
// Extended filters: identity, position_type, grade

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapPoliticianListFieldsWithScore } from "@/utils/fieldMapper";

const getPoliticiansQuerySchema = z.object({
  page: z.string().nullable().optional().default("1").transform(Number),
  limit: z.string().nullable().optional().default("20").transform(Number),
  search: z.string().nullable().optional().default(""),
  party: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  identity: z.string().nullable().optional(), // 신분: 현직/전직/후보자
  position_type: z.string().nullable().optional(), // 출마직종: 국회의원/광역의원/기초의원
  grade: z.string().nullable().optional(), // 평가등급: M/D/E/P/G/S/B/I/Tn/L
  verified_only: z.enum(["true", "false"]).nullable().optional().transform(val => val === "true"),
  sort: z.string().nullable().optional().default("name"),
  order: z.enum(["asc", "desc"]).nullable().optional().default("asc"),
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
      identity: searchParams.get("identity"),
      position_type: searchParams.get("position_type"),
      grade: searchParams.get("grade"),
      verified_only: searchParams.get("verified_only"),
      sort: searchParams.get("sort") || "name",
      order: searchParams.get("order") || "asc",
    };

    const query = getPoliticiansQuerySchema.parse(queryParams);

    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = await createClient();

    // Supabase 쿼리 빌더 시작
    // P3F3: identity, title 필드 포함 (select * 사용)
    let queryBuilder = supabase
      .from("politicians")
      .select("*", { count: "exact" });

    // Full-text 검색 (이름 필드에서 ILIKE 검색)
    // DEBUG: 검색 파라미터 로깅
    if (query.search) {
      console.log('[Politicians API] Search query:', query.search);
      queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
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

    // 신분 필터 (identity)
    if (query.identity) {
      queryBuilder = queryBuilder.eq("identity", query.identity);
    }

    // 출마직종 필터 (position_type)
    if (query.position_type) {
      queryBuilder = queryBuilder.eq("position_type", query.position_type);
    }

    if (query.verified_only) {
      queryBuilder = queryBuilder.not("verified_at", "is", null);
    }

    // 정렬 적용 (totalScore는 클라이언트 사이드에서 처리하므로 DB 정렬 스킵)
    if (query.sort !== "totalScore") {
      const isDescending = query.order === "desc";
      queryBuilder = queryBuilder.order(query.sort || "name", { ascending: !isDescending });
    }

    // totalScore 정렬일 때는 더 많은 데이터를 가져와서 클라이언트에서 정렬 후 limit 적용
    let start = (query.page - 1) * query.limit;
    let end = start + query.limit - 1;

    if (query.sort === "totalScore") {
      // 전체 데이터를 가져와서 클라이언트에서 정렬
      start = 0;
      end = 999; // 충분히 큰 수
    }

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

    // P3BA34: V24.0 AI 점수 조회 (ai_final_scores 테이블)
    const politicianIds = (politicians || []).map((p: any) => p.id);
    let scoresMap: Record<string, {
      claude_score: number;
      chatgpt_score: number;
      grok_score: number;
      total_score: number;
      grade?: string;
      updated_at: string;
    }> = {};

    // 회원 평가 데이터는 politicians 테이블에서 직접 가져옴 (select * 에 포함)
    // ratings API가 politicians.user_rating, politicians.rating_count를 업데이트함

    if (politicianIds.length > 0) {
      const { data: scores, error: scoresError } = await supabase
        .from("ai_final_scores")
        .select("politician_id, ai_name, total_score, grade_code, updated_at")
        .in("politician_id", politicianIds)
        .in("ai_name", ["Claude", "ChatGPT", "Grok"]);  // 3개 AI 점수 모두 가져오기

      if (scoresError) {
        console.error("AI final scores query error:", scoresError);
      } else if (scores) {
        // politician_id별로 AI별 점수 매핑
        scores.forEach((score: any) => {
          if (!scoresMap[score.politician_id]) {
            scoresMap[score.politician_id] = {
              claude_score: 0,
              chatgpt_score: 0,
              grok_score: 0,
              total_score: 0,
              grade: undefined,
              updated_at: score.updated_at
            };
          }

          const politicianScores = scoresMap[score.politician_id];

          // AI별로 점수 저장
          if (score.ai_name === "Claude") {
            politicianScores.claude_score = score.total_score;
            // Claude 점수를 기준으로 grade 설정
            politicianScores.grade = score.grade_code;
          } else if (score.ai_name === "ChatGPT") {
            politicianScores.chatgpt_score = score.total_score;
          } else if (score.ai_name === "Grok") {
            politicianScores.grok_score = score.total_score;
          }
        });

        // 모든 점수 저장 후 평균 계산
        Object.values(scoresMap).forEach((politicianScores) => {
          const validScores = [
            politicianScores.claude_score,
            politicianScores.chatgpt_score,
            politicianScores.grok_score
          ].filter(s => s > 0);

          if (validScores.length > 0) {
            politicianScores.total_score = Math.round(
              validScores.reduce((a, b) => a + b, 0) / validScores.length
            );
          }
        });
      }
    }

    // P3F4: Map fields for list view (snake_case → camelCase) with V24.0 scores
    // politicians 테이블의 user_rating, rating_count를 직접 사용 (select * 에 포함됨)
    let mappedPoliticians = (politicians || []).map((p: any) => {
      const scoreData = scoresMap[p.id];
      return mapPoliticianListFieldsWithScore(
        p,  // politicians 테이블에서 직접 user_rating, rating_count 포함
        scoreData?.total_score || 0,
        scoreData?.claude_score || 0,
        scoreData?.chatgpt_score || 0,
        scoreData?.grok_score || 0
      );
    });

    // 평가등급 필터 적용 (클라이언트 사이드 필터링)
    if (query.grade) {
      mappedPoliticians = mappedPoliticians.filter((p: any) => {
        const scoreData = scoresMap[p.id];
        return scoreData?.grade === query.grade;
      });
    }

    // totalScore 기준 정렬 (클라이언트 사이드)
    if (query.sort === 'totalScore') {
      mappedPoliticians = mappedPoliticians.sort((a: any, b: any) => {
        const scoreA = a.totalScore || 0;
        const scoreB = b.totalScore || 0;
        return query.order === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });

      // 정렬 후 페이지네이션 적용
      const startIdx = (query.page - 1) * query.limit;
      const endIdx = startIdx + query.limit;
      mappedPoliticians = mappedPoliticians.slice(startIdx, endIdx);
    }

    const response = NextResponse.json(
      {
        success: true,
        data: mappedPoliticians,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: query.grade || query.sort === 'totalScore' ? count || 0 : total,
          totalPages: query.grade || query.sort === 'totalScore' ? Math.ceil((count || 0) / query.limit) : totalPages,
          hasMore: query.grade || query.sort === 'totalScore' ? false : (query.page < totalPages)
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    // 캐시 헤더 추가 (5분 캐싱)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
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
    const supabase = await createClient();

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
