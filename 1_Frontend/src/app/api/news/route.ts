// P2BA6: AI 평가 결과 API (정치인별 평가 점수 및 시계열 데이터)
// Updated: 2025-11-17 - Mock 데이터 제거, 실제 DB 쿼리 사용

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const getEvaluationResultsSchema = z.object({
  politician_id: z.string().optional(),
  limit: z.string().optional().default("10").transform(Number),
});

type GetEvaluationResultsQuery = z.infer<typeof getEvaluationResultsSchema>;

// 평가 기준 정의
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "results"; // 'results' 또는 'timeseries'
    const politicianId = searchParams.get("politician_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createClient();

    if (type === "timeseries") {
      // 시계열 데이터: evaluations 테이블에서 가져오기
      let query = supabase
        .from('evaluations')
        .select(`
          politician_id,
          created_at,
          overall_score,
          claude_score,
          chatgpt_score,
          gemini_score,
          grok_score,
          perplexity_score
        `)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (politicianId) {
        query = query.eq('politician_id', politicianId);
      }

      const { data: evaluations, error } = await query;

      if (error) {
        console.error('[평가 시계열 API] DB 오류:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Database query failed',
            message: error.message,
          },
          { status: 500 }
        );
      }

      // 시계열 데이터 포맷 변환
      const timeSeriesData = (evaluations || []).map(evaluation => ({
        politician_id: evaluation.politician_id,
        date: new Date(evaluation.created_at).toISOString().split('T')[0],
        overall_score: evaluation.overall_score || 0,
        model_scores: {
          claude: evaluation.claude_score || 0,
          chatgpt: evaluation.chatgpt_score || 0,
          gemini: evaluation.gemini_score || 0,
          grok: evaluation.grok_score || 0,
          perplexity: evaluation.perplexity_score || 0,
        },
      }));

      return NextResponse.json(
        {
          success: true,
          type: "timeseries",
          data: timeSeriesData,
          count: timeSeriesData.length,
        },
        { status: 200 }
      );
    }

    // 평가 결과 반환 (기본값): evaluations + politicians 조인
    let query = supabase
      .from('evaluations')
      .select(`
        id,
        politician_id,
        overall_score,
        claude_score,
        chatgpt_score,
        gemini_score,
        grok_score,
        perplexity_score,
        criteria_scores,
        created_at,
        expires_at,
        politicians:politician_id (
          name,
          party,
          position
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (politicianId) {
      query = query.eq('politician_id', politicianId);
    }

    const { data: evaluations, error } = await query;

    if (error) {
      console.error('[평가 결과 API] DB 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // 평가 결과 포맷 변환
    const results = (evaluations || []).map(evaluation => ({
      id: evaluation.id,
      politician_id: evaluation.politician_id,
      name: (evaluation.politicians as any)?.name || '알 수 없음',
      party: (evaluation.politicians as any)?.party || '',
      position: (evaluation.politicians as any)?.position || '',
      ai_model: 'claude', // 주요 모델
      overall_score: evaluation.overall_score || 0,
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
    }));

    return NextResponse.json(
      {
        success: true,
        type: "results",
        data: results,
        count: results.length,
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
