// P2BA5: AI 평가 요청 API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const evaluationRequestSchema = z.object({
  politician_id: z.string().min(1),
  name: z.string().min(1),
  party: z.string().min(1),
  position: z.string().min(1),
  ai_model: z.enum(["claude", "chatgpt", "gemini", "grok", "perplexity"]),
});

type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;

// 평가 기준
const EVALUATION_CRITERIA = {
  integrity: "청렴성",
  expertise: "전문성",
  communication: "소통능력",
  leadership: "리더십",
  responsibility: "책임감",
  transparency: "투명성",
  responsiveness: "대응성",
  vision: "비전",
  public_interest: "공익추구",
  ethics: "윤리성",
};

// AI 모델별 점수 범위 (시뮬레이션용)
const AI_MODEL_SCORES = {
  claude: { min: 85, max: 97 },
  chatgpt: { min: 80, max: 95 },
  gemini: { min: 75, max: 92 },
  grok: { min: 82, max: 96 },
  perplexity: { min: 78, max: 94 },
};

// 평가 결과 생성 (Mock)
function generateEvaluationResult(
  politician: EvaluationRequest,
  randomSeed: number
) {
  const scores = AI_MODEL_SCORES[politician.ai_model];
  const baseScore =
    Math.floor(scores.min + (randomSeed % (scores.max - scores.min)));

  const criteria = Object.entries(EVALUATION_CRITERIA).reduce(
    (acc, [key, label]) => {
      acc[key] = Math.floor(baseScore * (0.8 + Math.random() * 0.4));
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    politician_id: politician.politician_id,
    name: politician.name,
    party: politician.party,
    position: politician.position,
    ai_model: politician.ai_model,
    overall_score: baseScore,
    criteria: criteria,
    evaluated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 유효
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = evaluationRequestSchema.parse(body);

    // AI 평가 요청 처리 (실제로는 AI 모델 호출)
    const randomSeed = Date.now();
    const evaluationResult = generateEvaluationResult(validated, randomSeed);

    return NextResponse.json(
      {
        success: true,
        message: `${validated.ai_model} 평가 요청이 처리되었습니다`,
        data: evaluationResult,
        evaluation_criteria: EVALUATION_CRITERIA,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: 평가 결과 조회 (Real DB)
// Updated: 2025-11-17 - Mock 데이터 제거, 실제 DB 쿼리 사용
export async function GET(request: NextRequest) {
  try {
    const politicianId = request.nextUrl.searchParams.get("politician_id");
    const aiModel = request.nextUrl.searchParams.get("ai_model");

    if (!politicianId) {
      return NextResponse.json(
        { success: false, error: "politician_id is required" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // DB에서 평가 결과 조회
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        politicians:politician_id (
          name,
          party,
          position
        )
      `)
      .eq('politician_id', politicianId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !evaluation) {
      console.log('[평가 조회 API] 평가 데이터 없음:', politicianId);
      return NextResponse.json(
        {
          success: false,
          error: "평가 데이터를 찾을 수 없습니다. AI 평가를 먼저 요청해주세요.",
          politician_id: politicianId,
        },
        { status: 404 }
      );
    }

    // 특정 AI 모델 점수만 반환하거나 종합 평가 반환
    const modelScore = aiModel ?
      evaluation[`${aiModel}_score` as keyof typeof evaluation] || 0 :
      evaluation.overall_score || 0;

    const result = {
      politician_id: evaluation.politician_id,
      name: (evaluation.politicians as any)?.name || '알 수 없음',
      party: (evaluation.politicians as any)?.party || '',
      position: (evaluation.politicians as any)?.position || '',
      ai_model: aiModel || "overall",
      overall_score: modelScore,
      criteria: evaluation.criteria_scores || {},
      model_scores: {
        claude: evaluation.claude_score || 0,
        chatgpt: evaluation.chatgpt_score || 0,
        gemini: evaluation.gemini_score || 0,
        grok: evaluation.grok_score || 0,
        perplexity: evaluation.perplexity_score || 0,
      },
      evaluated_at: evaluation.created_at,
      expires_at: evaluation.expires_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
        evaluation_criteria: EVALUATION_CRITERIA,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
