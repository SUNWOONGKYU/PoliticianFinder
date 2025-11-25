// Task ID: P3BA12
// PATCH /api/evaluations/[evaluationId]/update - AI 평가 수정

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// 부분 업데이트 인터페이스
interface UpdateEvaluationRequest {
  overall_score?: number;
  overall_grade?: string;
  pledge_completion_rate?: number;
  activity_score?: number;
  controversy_score?: number;
  public_sentiment_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
  detailed_analysis?: any; // JSONB 타입
  sources?: string[];
}

/**
 * PATCH /api/evaluations/[evaluationId]/update
 * 기존 평가 수정 (부분 업데이트 지원)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const supabase = await createClient();
    const evaluationId = params.evaluationId;

    // 1. 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 2. 평가 ID 검증
    if (!evaluationId) {
      return NextResponse.json(
        { success: false, error: "평가 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 3. 기존 평가 존재 여부 확인
    const { data: existingEvaluation, error: fetchError } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single();

    if (fetchError || !existingEvaluation) {
      return NextResponse.json(
        { success: false, error: "평가를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 4. 요청 데이터 파싱
    const body: UpdateEvaluationRequest = await request.json();

    // 5. 업데이트할 데이터 검증
    const updateData: any = {};

    // 점수 검증 (0-100 범위)
    if (body.overall_score !== undefined) {
      if (body.overall_score < 0 || body.overall_score > 100) {
        return NextResponse.json(
          { success: false, error: "overall_score는 0-100 범위여야 합니다" },
          { status: 400 }
        );
      }
      updateData.overall_score = body.overall_score;
    }

    if (body.pledge_completion_rate !== undefined) {
      if (body.pledge_completion_rate < 0 || body.pledge_completion_rate > 100) {
        return NextResponse.json(
          { success: false, error: "pledge_completion_rate는 0-100 범위여야 합니다" },
          { status: 400 }
        );
      }
      updateData.pledge_completion_rate = body.pledge_completion_rate;
    }

    if (body.activity_score !== undefined) {
      if (body.activity_score < 0 || body.activity_score > 100) {
        return NextResponse.json(
          { success: false, error: "activity_score는 0-100 범위여야 합니다" },
          { status: 400 }
        );
      }
      updateData.activity_score = body.activity_score;
    }

    if (body.controversy_score !== undefined) {
      if (body.controversy_score < 0 || body.controversy_score > 100) {
        return NextResponse.json(
          { success: false, error: "controversy_score는 0-100 범위여야 합니다" },
          { status: 400 }
        );
      }
      updateData.controversy_score = body.controversy_score;
    }

    if (body.public_sentiment_score !== undefined) {
      if (body.public_sentiment_score < 0 || body.public_sentiment_score > 100) {
        return NextResponse.json(
          { success: false, error: "public_sentiment_score는 0-100 범위여야 합니다" },
          { status: 400 }
        );
      }
      updateData.public_sentiment_score = body.public_sentiment_score;
    }

    // 기타 필드
    if (body.overall_grade !== undefined) {
      updateData.overall_grade = body.overall_grade;
    }

    if (body.strengths !== undefined) {
      if (!Array.isArray(body.strengths)) {
        return NextResponse.json(
          { success: false, error: "strengths는 배열이어야 합니다" },
          { status: 400 }
        );
      }
      updateData.strengths = body.strengths;
    }

    if (body.weaknesses !== undefined) {
      if (!Array.isArray(body.weaknesses)) {
        return NextResponse.json(
          { success: false, error: "weaknesses는 배열이어야 합니다" },
          { status: 400 }
        );
      }
      updateData.weaknesses = body.weaknesses;
    }

    if (body.summary !== undefined) {
      updateData.summary = body.summary;
    }

    if (body.detailed_analysis !== undefined) {
      // JSONB 필드 부분 업데이트 (기존 값과 병합)
      updateData.detailed_analysis = {
        ...existingEvaluation.detailed_analysis,
        ...body.detailed_analysis,
      };
    }

    if (body.sources !== undefined) {
      if (!Array.isArray(body.sources)) {
        return NextResponse.json(
          { success: false, error: "sources는 배열이어야 합니다" },
          { status: 400 }
        );
      }
      updateData.sources = body.sources;
    }

    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "업데이트할 데이터가 없습니다" },
        { status: 400 }
      );
    }

    // 버전 관리 (updated_at 자동 업데이트)
    updateData.updated_at = new Date().toISOString();

    // 6. 데이터베이스 업데이트
    const { data: updatedEvaluation, error: updateError } = await supabase
      .from("ai_evaluations")
      .update(updateData)
      .eq("id", evaluationId)
      .select(`
        *,
        politicians (
          id,
          name,
          political_party_id,
          position_id
        )
      `)
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { success: false, error: "평가 수정 중 오류가 발생했습니다", details: updateError.message },
        { status: 500 }
      );
    }

    // 7. 응답 데이터 포맷팅
    const responseData = {
      id: updatedEvaluation.id,
      politician: {
        id: updatedEvaluation.politician_id,
        name: updatedEvaluation.politicians?.name || "Unknown",
        political_party_id: updatedEvaluation.politicians?.political_party_id,
        position_id: updatedEvaluation.politicians?.position_id,
      },
      evaluation_date: updatedEvaluation.evaluation_date,
      overall_score: updatedEvaluation.overall_score,
      overall_grade: updatedEvaluation.overall_grade,
      scores: {
        pledge_completion: updatedEvaluation.pledge_completion_rate,
        activity: updatedEvaluation.activity_score,
        controversy: updatedEvaluation.controversy_score,
        public_sentiment: updatedEvaluation.public_sentiment_score,
      },
      detailed_analysis: updatedEvaluation.detailed_analysis,
      summary: updatedEvaluation.summary,
      strengths: updatedEvaluation.strengths,
      weaknesses: updatedEvaluation.weaknesses,
      sources: updatedEvaluation.sources,
      ai_model_version: updatedEvaluation.ai_model_version,
      created_at: updatedEvaluation.created_at,
      updated_at: updatedEvaluation.updated_at,
      updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "평가가 수정되었습니다",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("PATCH /api/evaluations/[evaluationId]/update error:", error);
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
