// Task ID: P3BA12
// POST /api/evaluations/generate - AI 평가 생성 (Mock → Real)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// AI 모델 타입 정의 (3개: Claude, ChatGPT, Grok)
type AIModel = 'claude' | 'chatgpt' | 'grok';

// 요청 본문 인터페이스
interface GenerateEvaluationRequest {
  politician_id: string;
  evaluator: AIModel;
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
 * 실제 AI 연동은 P4BA14에서 구현
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
  // Mock 점수 (evaluator별로 약간의 차이)
  const baseScore = evaluator === 'claude' ? 85 : evaluator === 'chatgpt' ? 83 : 82;

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

  // 전체 점수 계산 (10개 기준의 평균)
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

  // 등급 계산
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
 * POST /api/evaluations/generate
 * AI 평가 생성 (Mock 데이터 저장)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 파싱 및 검증
    const body: GenerateEvaluationRequest = await request.json();
    const { politician_id, evaluator } = body;

    // 필수 파라미터 검증
    if (!politician_id || !evaluator) {
      return NextResponse.json(
        { success: false, error: "politician_id와 evaluator가 필요합니다" },
        { status: 400 }
      );
    }

    // AI 모델 검증
    const validModels: AIModel[] = ['claude', 'chatgpt', 'grok'];
    if (!validModels.includes(evaluator)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 AI 모델입니다. 사용 가능한 모델: ${validModels.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 3. 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name")
      .eq("id", politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 4. Mock 평가 데이터 생성
    const mockData = generateMockEvaluation(evaluator);

    // 5. Supabase에 저장 (Upsert)
    // politician_id + ai_model_version 조합으로 중복 방지
    const evaluationDate = new Date().toISOString().split('T')[0];
    const aiModelVersion = `${evaluator}-3.5-${evaluationDate}`;

    const evaluationData = {
      politician_id,
      evaluation_date: evaluationDate,
      overall_score: mockData.overall_score,
      overall_grade: mockData.overall_grade,
      pledge_completion_rate: Math.floor(Math.random() * 20) + 80, // Mock: 80-100
      activity_score: Math.floor(Math.random() * 15) + 85, // Mock: 85-100
      controversy_score: Math.floor(Math.random() * 30) + 70, // Mock: 70-100
      public_sentiment_score: Math.floor(Math.random() * 20) + 75, // Mock: 75-95
      strengths: mockData.strengths,
      weaknesses: mockData.weaknesses,
      summary: mockData.summary,
      detailed_analysis: mockData.criteria, // JSONB 필드
      sources: mockData.sources,
      ai_model_version: aiModelVersion,
      updated_at: new Date().toISOString(),
    };

    // 기존 평가 확인 (같은 날짜, 같은 모델)
    const { data: existingEvaluation } = await supabase
      .from("ai_evaluations")
      .select("id")
      .eq("politician_id", politician_id)
      .eq("ai_model_version", aiModelVersion)
      .single();

    let data, error;

    if (existingEvaluation) {
      // 업데이트
      ({ data, error } = await supabase
        .from("ai_evaluations")
        .update(evaluationData)
        .eq("id", existingEvaluation.id)
        .select()
        .single());
    } else {
      // 신규 생성
      ({ data, error } = await supabase
        .from("ai_evaluations")
        .insert(evaluationData)
        .select()
        .single());
    }

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: "평가 저장 중 오류가 발생했습니다", details: error.message },
        { status: 500 }
      );
    }

    // 6. 응답 데이터 포맷팅
    const responseData = {
      id: data.id,
      politician: {
        id: politician.id,
        name: politician.name,
      },
      evaluator,
      ai_model_version: aiModelVersion,
      evaluation_date: data.evaluation_date,
      overall_score: data.overall_score,
      overall_grade: data.overall_grade,
      scores: {
        pledge_completion: data.pledge_completion_rate,
        activity: data.activity_score,
        controversy: data.controversy_score,
        public_sentiment: data.public_sentiment_score,
      },
      detailed_criteria: data.detailed_analysis,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      sources: data.sources,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: existingEvaluation ? "평가가 업데이트되었습니다" : "평가가 생성되었습니다",
      },
      { status: existingEvaluation ? 200 : 201 }
    );

  } catch (error) {
    console.error("POST /api/evaluations/generate error:", error);
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
