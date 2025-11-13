// P3BA2: Real API - 정치인 상세 (Supabase + AI Evaluations)
// 정치인 상세 정보 및 AI 평가 데이터 조회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "정치인 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = createClient();

    // 정치인 상세 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("*")
      .eq("id", id)
      .single();

    if (politicianError) {
      console.error("Supabase query error:", politicianError);
      if (politicianError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: politicianError.message
        },
        { status: 500 }
      );
    }

    // AI 평가 정보 조회 (ai_evaluations 테이블)
    const { data: aiEvaluations, error: evalError } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("politician_id", id)
      .order("evaluation_date", { ascending: false });

    if (evalError) {
      console.error("AI evaluations query error:", evalError);
    }

    // AI 평가 데이터 그룹화 (모델별)
    const evaluationsByModel: Record<string, any> = {};
    aiEvaluations?.forEach((evaluation) => {
      const modelKey = evaluation.ai_model.toLowerCase();
      evaluationsByModel[modelKey] = {
        overall_score: evaluation.overall_score,
        evaluation_date: evaluation.evaluation_date,
        expiry_date: evaluation.expiry_date,
        report_url: evaluation.report_url,
        raw_data: evaluation.raw_data,
      };
    });

    // 응답 데이터 구성
    const responseData = {
      // 기본 정보
      id: politician.id,
      name: politician.name,
      name_kana: politician.name_kana,
      name_english: politician.name_english,
      birth_date: politician.birth_date,
      gender: politician.gender,
      political_party_id: politician.political_party_id,
      position_id: politician.position_id,
      constituency_id: politician.constituency_id,

      // 연락처 및 SNS
      phone: politician.phone,
      email: politician.email,
      website: politician.website,
      twitter_handle: politician.twitter_handle,
      facebook_url: politician.facebook_url,
      instagram_handle: politician.instagram_handle,

      // 프로필
      profile_image_url: politician.profile_image_url,
      bio: politician.bio,

      // 메타데이터
      verified_at: politician.verified_at,
      is_active: politician.is_active,
      created_at: politician.created_at,
      updated_at: politician.updated_at,

      // 평가 점수
      evaluation_score: politician.evaluation_score,
      ai_score: politician.ai_score,
      user_rating: politician.user_rating,
      rating_count: politician.rating_count,

      // AI 평가 정보
      ai_evaluations: evaluationsByModel,
      has_evaluations: Object.keys(evaluationsByModel).length > 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/politicians/[id] error:", error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Supabase 서버 클라이언트 생성
    const supabase = createClient();

    // 업데이트 스키마 검증
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
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
      is_active: z.boolean().optional(),
      verified_at: z.string().optional(),
    });

    const validated = updateSchema.parse(body);

    // 정치인 정보 업데이트 (RLS 정책 준수)
    const { data: updatedPolitician, error } = await supabase
      .from("politicians")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "정치인 정보 업데이트 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPolitician,
        message: "정치인 정보가 업데이트되었습니다."
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "유효하지 않은 입력 데이터입니다.",
        details: error.errors
      }, { status: 400 });
    }

    console.error("PATCH error:", error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Supabase 서버 클라이언트 생성
    const supabase = createClient();

    // 정치인 삭제 (소프트 삭제: is_active = false로 설정)
    const { data: deletedPolitician, error } = await supabase
      .from("politicians")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase soft delete error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "정치인 삭제 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "정치인이 비활성화되었습니다.",
        data: deletedPolitician
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
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
