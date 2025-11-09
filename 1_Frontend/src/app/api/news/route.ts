// P2BA6: AI 평가 결과 API (정치인별 평가 점수 및 시계열 데이터)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

// Mock 평가 결과 데이터
const mockEvaluationResults = [
  {
    id: "eval-1",
    politician_id: "1",
    name: "김민준",
    party: "더불어민주당",
    position: "국회의원",
    ai_model: "claude",
    overall_score: 97,
    criteria: {
      integrity: 98,
      expertise: 95,
      communication: 97,
      leadership: 96,
      responsibility: 99,
      transparency: 94,
      responsiveness: 97,
      vision: 96,
      public_interest: 95,
      ethics: 98,
    },
    evaluated_at: "2025-01-10T10:00:00Z",
    expires_at: "2025-02-10T10:00:00Z",
  },
  {
    id: "eval-2",
    politician_id: "2",
    name: "이서연",
    party: "국민의힘",
    position: "국회의원",
    ai_model: "chatgpt",
    overall_score: 88,
    criteria: {
      integrity: 90,
      expertise: 86,
      communication: 88,
      leadership: 87,
      responsibility: 89,
      transparency: 85,
      responsiveness: 88,
      vision: 87,
      public_interest: 86,
      ethics: 90,
    },
    evaluated_at: "2025-01-09T15:30:00Z",
    expires_at: "2025-02-09T15:30:00Z",
  },
  {
    id: "eval-3",
    politician_id: "3",
    name: "박지후",
    party: "정의당",
    position: "광역의원",
    ai_model: "gemini",
    overall_score: 82,
    criteria: {
      integrity: 84,
      expertise: 80,
      communication: 82,
      leadership: 81,
      responsibility: 83,
      transparency: 79,
      responsiveness: 82,
      vision: 81,
      public_interest: 80,
      ethics: 84,
    },
    evaluated_at: "2025-01-08T09:00:00Z",
    expires_at: "2025-02-08T09:00:00Z",
  },
];

// Mock 시계열 데이터
const mockTimeSeriesData = [
  {
    politician_id: "1",
    date: "2025-01-01",
    overall_score: 95,
    model_scores: {
      claude: 94,
      chatgpt: 93,
      gemini: 92,
      grok: 95,
      perplexity: 93,
    },
  },
  {
    politician_id: "1",
    date: "2025-01-05",
    overall_score: 96,
    model_scores: {
      claude: 96,
      chatgpt: 94,
      gemini: 93,
      grok: 96,
      perplexity: 94,
    },
  },
  {
    politician_id: "1",
    date: "2025-01-10",
    overall_score: 97,
    model_scores: {
      claude: 97,
      chatgpt: 95,
      gemini: 94,
      grok: 96,
      perplexity: 95,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "results"; // 'results' 또는 'timeseries'
    const politicianId = searchParams.get("politician_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (type === "timeseries") {
      // 시계열 데이터 반환
      let timeSeriesData = mockTimeSeriesData;

      if (politicianId) {
        timeSeriesData = timeSeriesData.filter(
          (d) => d.politician_id === politicianId
        );
      }

      return NextResponse.json(
        {
          success: true,
          type: "timeseries",
          data: timeSeriesData.slice(0, limit),
          count: timeSeriesData.length,
        },
        { status: 200 }
      );
    }

    // 평가 결과 반환 (기본값)
    let results = mockEvaluationResults;

    if (politicianId) {
      results = results.filter((r) => r.politician_id === politicianId);
    }

    return NextResponse.json(
      {
        success: true,
        type: "results",
        data: results.slice(0, limit),
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
