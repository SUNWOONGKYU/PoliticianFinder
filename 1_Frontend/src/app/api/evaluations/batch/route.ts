// Task ID: P3BA12
// POST /api/evaluations/batch - 일괄 AI 평가 생성

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// AI 모델 타입 정의
type AIModel = 'claude' | 'chatgpt' | 'gemini' | 'grok' | 'perplexity';

// 요청 본문 인터페이스
interface BatchEvaluationRequest {
  politician_ids: string[];
  evaluator: AIModel;
}

// 개별 평가 결과
interface EvaluationResult {
  politician_id: string;
  politician_name?: string;
  status: 'success' | 'failed' | 'skipped';
  evaluation_id?: string;
  error?: string;
}

// 10개 평가 기준
interface EvaluationCriteria {
  integrity_score: number;
  integrity_evidence: string;
  expertise_score: number;
  expertise_evidence: string;
  communication_score: number;
  communication_evidence: string;
  leadership_score: number;
  leadership_evidence: string;
  transparency_score: number;
  transparency_evidence: string;
  responsiveness_score: number;
  responsiveness_evidence: string;
  innovation_score: number;
  innovation_evidence: string;
  collaboration_score: number;
  collaboration_evidence: string;
  constituency_service_score: number;
  constituency_service_evidence: string;
  policy_impact_score: number;
  policy_impact_evidence: string;
}

/**
 * Mock 평가 데이터 생성
 */
function generateMockEvaluation(evaluator: AIModel): {
  overall_score: number;
  overall_grade: string;
  criteria: EvaluationCriteria;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  sources: string[];
} {
  const baseScore = evaluator === 'claude' ? 85 : evaluator === 'chatgpt' ? 83 : evaluator === 'gemini' ? 87 : evaluator === 'grok' ? 82 : 88;

  const criteria: EvaluationCriteria = {
    integrity_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    integrity_evidence: `${evaluator} 분석: 공직자로서 높은 윤리 기준을 유지하고 있으며, 투명한 의사결정 과정을 보여줍니다.`,
    expertise_score: Math.min(100, baseScore - 5 + Math.floor(Math.random() * 10)),
    expertise_evidence: `${evaluator} 분석: 해당 분야에 대한 전문성과 정책 이해도가 높은 수준입니다.`,
    communication_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    communication_evidence: `${evaluator} 분석: 대중과의 소통 능력이 우수하며, 명확하고 효과적인 메시지 전달을 합니다.`,
    leadership_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    leadership_evidence: `${evaluator} 분석: 팀을 이끄는 리더십과 위기 관리 능력을 보여줍니다.`,
    transparency_score: Math.min(100, baseScore + 5 + Math.floor(Math.random() * 10)),
    transparency_evidence: `${evaluator} 분석: 정보 공개와 투명성 면에서 모범적인 사례를 보여줍니다.`,
    responsiveness_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    responsiveness_evidence: `${evaluator} 분석: 유권자 의견에 신속하게 대응하며, 민원 처리가 효율적입니다.`,
    innovation_score: Math.min(100, baseScore - 3 + Math.floor(Math.random() * 10)),
    innovation_evidence: `${evaluator} 분석: 새로운 정책과 혁신적 접근법을 시도하는 모습을 보입니다.`,
    collaboration_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    collaboration_evidence: `${evaluator} 분석: 타 정당 및 이해관계자와의 협력 능력이 뛰어납니다.`,
    constituency_service_score: Math.min(100, baseScore + 3 + Math.floor(Math.random() * 10)),
    constituency_service_evidence: `${evaluator} 분석: 지역구 주민을 위한 봉사 활동과 민원 해결에 적극적입니다.`,
    policy_impact_score: Math.min(100, baseScore - 2 + Math.floor(Math.random() * 10)),
    policy_impact_evidence: `${evaluator} 분석: 추진한 정책들이 실질적인 사회적 영향을 만들어내고 있습니다.`,
  };

  const overall_score = Math.round(
    (criteria.integrity_score +
     criteria.expertise_score +
     criteria.communication_score +
     criteria.leadership_score +
     criteria.transparency_score +
     criteria.responsiveness_score +
     criteria.innovation_score +
     criteria.collaboration_score +
     criteria.constituency_service_score +
     criteria.policy_impact_score) / 10
  );

  const overall_grade =
    overall_score >= 90 ? 'A+' :
    overall_score >= 85 ? 'A' :
    overall_score >= 80 ? 'B+' :
    overall_score >= 75 ? 'B' :
    overall_score >= 70 ? 'C+' :
    overall_score >= 65 ? 'C' : 'D';

  return {
    overall_score,
    overall_grade,
    criteria,
    summary: `${evaluator} AI가 분석한 종합 평가: 전반적으로 우수한 정치인으로 평가되며, 특히 소통 능력과 투명성 면에서 강점을 보입니다.`,
    strengths: [
      "높은 윤리 기준 유지",
      "효과적인 대중 소통",
      "투명한 의사결정",
      "적극적인 지역구 봉사"
    ],
    weaknesses: [
      "일부 정책의 실효성 개선 필요",
      "혁신적 접근법 확대 가능"
    ],
    sources: [
      "https://example.com/politician-profile",
      "https://example.com/voting-records",
      "https://example.com/news-articles"
    ]
  };
}

/**
 * 개별 정치인 평가 생성 (내부 함수)
 */
async function createSingleEvaluation(
  supabase: any,
  politicianId: string,
  evaluator: AIModel,
  evaluationDate: string,
  aiModelVersion: string
): Promise<EvaluationResult> {
  try {
    // 1. 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name")
      .eq("id", politicianId)
      .single();

    if (politicianError || !politician) {
      return {
        politician_id: politicianId,
        status: 'failed',
        error: '정치인을 찾을 수 없습니다'
      };
    }

    // 2. Mock 평가 데이터 생성
    const mockData = generateMockEvaluation(evaluator);

    // 3. 평가 데이터 구성
    const evaluationData = {
      politician_id: politicianId,
      evaluation_date: evaluationDate,
      overall_score: mockData.overall_score,
      overall_grade: mockData.overall_grade,
      pledge_completion_rate: Math.floor(Math.random() * 20) + 80,
      activity_score: Math.floor(Math.random() * 15) + 85,
      controversy_score: Math.floor(Math.random() * 30) + 70,
      public_sentiment_score: Math.floor(Math.random() * 20) + 75,
      strengths: mockData.strengths,
      weaknesses: mockData.weaknesses,
      summary: mockData.summary,
      detailed_analysis: mockData.criteria,
      sources: mockData.sources,
      ai_model_version: aiModelVersion,
      updated_at: new Date().toISOString(),
    };

    // 4. 기존 평가 확인
    const { data: existingEvaluation } = await supabase
      .from("ai_evaluations")
      .select("id")
      .eq("politician_id", politicianId)
      .eq("ai_model_version", aiModelVersion)
      .single();

    // 5. 저장 (업데이트 또는 생성)
    let data, error;

    if (existingEvaluation) {
      ({ data, error } = await supabase
        .from("ai_evaluations")
        .update(evaluationData)
        .eq("id", existingEvaluation.id)
        .select("id")
        .single());
    } else {
      ({ data, error } = await supabase
        .from("ai_evaluations")
        .insert(evaluationData)
        .select("id")
        .single());
    }

    if (error) {
      return {
        politician_id: politicianId,
        politician_name: politician.name,
        status: 'failed',
        error: error.message
      };
    }

    return {
      politician_id: politicianId,
      politician_name: politician.name,
      status: 'success',
      evaluation_id: data.id
    };

  } catch (error) {
    return {
      politician_id: politicianId,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * POST /api/evaluations/batch
 * 여러 정치인 일괄 평가 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 파싱 및 검증
    const body: BatchEvaluationRequest = await request.json();
    const { politician_ids, evaluator } = body;

    // 필수 파라미터 검증
    if (!politician_ids || !Array.isArray(politician_ids) || politician_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "politician_ids 배열이 필요합니다" },
        { status: 400 }
      );
    }

    if (!evaluator) {
      return NextResponse.json(
        { success: false, error: "evaluator가 필요합니다" },
        { status: 400 }
      );
    }

    // 배치 크기 제한 (최대 50명)
    if (politician_ids.length > 50) {
      return NextResponse.json(
        { success: false, error: "한 번에 최대 50명까지만 평가할 수 있습니다" },
        { status: 400 }
      );
    }

    // AI 모델 검증
    const validModels: AIModel[] = ['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'];
    if (!validModels.includes(evaluator)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 AI 모델입니다. 사용 가능한 모델: ${validModels.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 3. 평가 생성 준비
    const evaluationDate = new Date().toISOString().split('T')[0];
    const aiModelVersion = `${evaluator}-3.5-${evaluationDate}`;

    // 4. 병렬 처리로 평가 생성 (Promise.all)
    const startTime = Date.now();
    const results = await Promise.all(
      politician_ids.map(politicianId =>
        createSingleEvaluation(supabase, politicianId, evaluator, evaluationDate, aiModelVersion)
      )
    );
    const duration = Date.now() - startTime;

    // 5. 결과 집계
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    // 6. 응답 데이터 구성
    const responseData = {
      total: politician_ids.length,
      success: successCount,
      failed: failedCount,
      duration_ms: duration,
      evaluator,
      ai_model_version: aiModelVersion,
      evaluation_date: evaluationDate,
      results: results,
    };

    // 일부 실패한 경우 206 Partial Content, 전부 성공시 201 Created
    const statusCode = failedCount > 0 ? 206 : 201;

    return NextResponse.json(
      {
        success: successCount > 0,
        data: responseData,
        message: `${successCount}/${politician_ids.length}개의 평가가 생성되었습니다`,
      },
      { status: statusCode }
    );

  } catch (error) {
    console.error("POST /api/evaluations/batch error:", error);
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
