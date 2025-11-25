// Task ID: P3BA11
// GET /api/politicians/[id]/evaluation - 정치인 AI 평가 조회 (Real Supabase 연동)
// POST /api/politicians/[id]/evaluation - 정치인 AI 평가 생성 요청

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// AI 모델 타입
const AI_MODELS = ["claude", "chatgpt", "gemini", "grok", "perplexity"] as const;

// 평가 기준 (10개)
const EVALUATION_CRITERIA = {
  integrity: "청렴성",
  expertise: "전문성",
  communication: "소통능력",
  leadership: "리더십",
  transparency: "투명성",
  responsiveness: "대응성",
  innovation: "혁신성",
  collaboration: "협력성",
  constituency_service: "지역구 서비스",
  policy_impact: "정책 영향력",
} as const;

const createEvaluationSchema = z.object({
  evaluatorType: z.enum(AI_MODELS),
});

/**
 * GET /api/politicians/[id]/evaluation
 * 정치인 AI 평가 조회 (5개 AI 모델 통합)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = await createClient();

    // 1. 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name, political_party_id, position_id")
      .eq("id", id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 2. 최신 AI 평가 데이터 조회 (5개 모델별 최신 1개씩)
    const { data: evaluations, error: evaluationsError } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("politician_id", id)
      .order("created_at", { ascending: false });

    if (evaluationsError) {
      console.error("AI evaluations query error:", evaluationsError);
      return NextResponse.json(
        { success: false, error: "평가 데이터 조회 실패" },
        { status: 500 }
      );
    }

    // 평가 데이터가 없는 경우
    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            politician_id: id,
            name: politician.name,
            evaluations_available: false,
            message: "아직 AI 평가가 생성되지 않았습니다",
          },
        },
        { status: 200 }
      );
    }

    // 3. AI 모델별로 최신 평가 1개씩 추출
    const latestByModel: Record<string, any> = {};
    for (const evaluation of evaluations) {
      const modelVersion = evaluation.ai_model_version || "unknown";
      const modelName = modelVersion.split("-")[0].toLowerCase();

      if (!latestByModel[modelName] && AI_MODELS.includes(modelName as any)) {
        latestByModel[modelName] = evaluation;
      }
    }

    // 4. 응답 데이터 포맷팅
    const evaluatorsData: Record<string, any> = {};
    let totalScore = 0;
    let totalCount = 0;

    for (const modelName of AI_MODELS) {
      if (latestByModel[modelName]) {
        const eval_data = latestByModel[modelName];
        const detailedAnalysis = eval_data.detailed_analysis || {};

        evaluatorsData[modelName] = {
          score: eval_data.overall_score || 0,
          grade: eval_data.overall_grade || "N/A",
          completedAt: eval_data.created_at,
          criteria: {
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
          summary: eval_data.summary || "",
          strengths: eval_data.strengths || [],
          weaknesses: eval_data.weaknesses || [],
          sources: eval_data.sources || [],
        };

        totalScore += eval_data.overall_score || 0;
        totalCount++;
      }
    }

    // 5. 종합 평가 계산
    const averageScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
    const overallGrade = calculateGrade(averageScore);

    // 6. 최종 응답
    const responseData = {
      politician_id: id,
      name: politician.name,
      evaluations_available: true,
      overall_score: averageScore,
      overall_grade: overallGrade,
      total_evaluators: totalCount,
      evaluators: evaluatorsData,
      evaluation_criteria: EVALUATION_CRITERIA,
      last_updated: evaluations[0]?.created_at || new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/politicians/[id]/evaluation error:", error);
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

/**
 * POST /api/politicians/[id]/evaluation
 * 정치인 AI 평가 생성 요청 (트리거)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const validated = createEvaluationSchema.parse(body);
    const supabase = await createClient();

    // 1. 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name")
      .eq("id", id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 2. 평가 생성 요청 (실제로는 큐에 추가하고 백그라운드 작업으로 처리)
    // TODO: 실제 AI 평가 생성 로직 구현 (Phase 4에서 처리)
    const jobId = `eval-job-${id}-${validated.evaluatorType}-${Date.now()}`;

    return NextResponse.json(
      {
        success: true,
        message: `${validated.evaluatorType} AI 평가가 생성 큐에 추가되었습니다`,
        data: {
          politicianId: id,
          politicianName: politician.name,
          evaluatorType: validated.evaluatorType,
          jobId: jobId,
          status: "pending",
          estimatedTime: "2-3분",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 요청 데이터", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/politicians/[id]/evaluation error:", error);
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

/**
 * 점수를 기반으로 등급 계산
 */
function calculateGrade(score: number): string {
  if (score >= 90) return "Mugunghwa"; // 무궁화 (최고 등급)
  if (score >= 80) return "Rose"; // 장미
  if (score >= 70) return "Maple"; // 단풍
  if (score >= 60) return "Orchid"; // 난초
  return "Chrysanthemum"; // 국화
}
