// Task ID: P3BA11
// GET /api/evaluations/[evaluationId] - 개별 AI 평가 조회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/evaluations/[evaluationId]
 * 특정 평가 ID로 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const evaluationId = params.evaluationId;
    const supabase = createClient();

    // 1. 평가 데이터 조회
    const { data: evaluation, error: evaluationError } = await supabase
      .from("ai_evaluations")
      .select(`
        *,
        politicians (
          id,
          name,
          political_party_id,
          position_id
        )
      `)
      .eq("id", evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        { success: false, error: "평가 데이터를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 2. 상세 분석 데이터 추출
    const detailedAnalysis = evaluation.detailed_analysis || {};

    // 3. 응답 데이터 포맷팅
    const responseData = {
      id: evaluation.id,
      politician: {
        id: evaluation.politician_id,
        name: evaluation.politicians?.name || "Unknown",
        political_party_id: evaluation.politicians?.political_party_id,
        position_id: evaluation.politicians?.position_id,
      },
      ai_model: evaluation.ai_model_version || "Unknown",
      evaluation_date: evaluation.evaluation_date,
      overall_score: evaluation.overall_score || 0,
      overall_grade: evaluation.overall_grade || "N/A",

      // 세부 점수
      scores: {
        integrity: detailedAnalysis.integrity_score || 0,
        expertise: detailedAnalysis.expertise_score || 0,
        communication: detailedAnalysis.communication_score || 0,
        leadership: detailedAnalysis.leadership_score || 0,
        transparency: detailedAnalysis.transparency_score || 0,
        responsiveness: detailedAnalysis.responsiveness_score || 0,
        innovation: detailedAnalysis.innovation_score || 0,
        collaboration: detailedAnalysis.collaboration_score || 0,
        constituency_service: detailedAnalysis.constituency_service_score || 0,
        policy_impact: detailedAnalysis.policy_impact_score || 0,
      },

      // 근거
      evidence: {
        integrity: detailedAnalysis.integrity_evidence || "",
        expertise: detailedAnalysis.expertise_evidence || "",
        communication: detailedAnalysis.communication_evidence || "",
        leadership: detailedAnalysis.leadership_evidence || "",
        transparency: detailedAnalysis.transparency_evidence || "",
        responsiveness: detailedAnalysis.responsiveness_evidence || "",
        innovation: detailedAnalysis.innovation_evidence || "",
        collaboration: detailedAnalysis.collaboration_evidence || "",
        constituency_service: detailedAnalysis.constituency_service_evidence || "",
        policy_impact: detailedAnalysis.policy_impact_evidence || "",
      },

      // 기타 평가 정보
      summary: evaluation.summary || "",
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      sources: evaluation.sources || [],

      // 메타 정보
      created_at: evaluation.created_at,
      updated_at: evaluation.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/evaluations/[evaluationId] error:", error);
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
