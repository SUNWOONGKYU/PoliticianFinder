// Task ID: P3BA11
// GET /api/evaluations/history - 평가 이력 조회 (시계열 데이터)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/evaluations/history
 * 평가 이력 시계열 데이터 조회 (최근 30일)
 *
 * Query Parameters:
 * - politician_id: 특정 정치인의 이력 (필수)
 * - days: 조회 일수 (기본값: 30, 최대: 90)
 * - ai_model: 특정 AI 모델로 필터링 (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const politicianId = searchParams.get("politician_id");
    const daysParam = searchParams.get("days");
    const aiModel = searchParams.get("ai_model");

    // 1. 필수 파라미터 검증
    if (!politicianId) {
      return NextResponse.json(
        { success: false, error: "politician_id 파라미터가 필요합니다" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 2. 정치인 존재 여부 확인
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name")
      .eq("id", politicianId)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 3. 조회 기간 계산 (최대 90일)
    const days = Math.min(parseInt(daysParam || "30"), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 4. 평가 이력 조회
    let query = supabase
      .from("ai_evaluations")
      .select("*")
      .eq("politician_id", politicianId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // AI 모델 필터링 (선택)
    if (aiModel) {
      query = query.ilike("ai_model_version", `${aiModel}%`);
    }

    const { data: evaluations, error: evaluationsError } = await query;

    if (evaluationsError) {
      console.error("Evaluations history query error:", evaluationsError);
      return NextResponse.json(
        { success: false, error: "평가 이력 조회 실패" },
        { status: 500 }
      );
    }

    // 5. 시계열 데이터 포맷팅
    const timeSeriesData = evaluations.map((evaluation) => {
      const detailedAnalysis = evaluation.detailed_analysis || {};

      return {
        id: evaluation.id,
        date: evaluation.evaluation_date,
        created_at: evaluation.created_at,
        ai_model: evaluation.ai_model_version || "Unknown",
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

        summary: evaluation.summary || "",
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
      };
    });

    // 6. 통계 계산
    const statistics = calculateStatistics(timeSeriesData);

    // 7. 응답 데이터
    const responseData = {
      politician: {
        id: politician.id,
        name: politician.name,
      },
      period: {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        days: days,
      },
      filters: {
        ai_model: aiModel || "all",
      },
      total_evaluations: timeSeriesData.length,
      time_series: timeSeriesData,
      statistics: statistics,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        status: 200,
        headers: {
          // 5분 캐싱
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/evaluations/history error:", error);
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
 * 시계열 데이터 통계 계산
 */
function calculateStatistics(timeSeriesData: any[]) {
  if (timeSeriesData.length === 0) {
    return {
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      score_trend: "stable",
      evaluation_count: 0,
    };
  }

  const scores = timeSeriesData.map((item) => item.overall_score);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const average = Math.round(sum / scores.length);
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  // 추세 계산 (최근 5개 vs 이전 5개 비교)
  let trend = "stable";
  if (timeSeriesData.length >= 10) {
    const recentScores = scores.slice(-5);
    const previousScores = scores.slice(-10, -5);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / 5;
    const previousAvg = previousScores.reduce((a, b) => a + b, 0) / 5;

    if (recentAvg > previousAvg + 5) {
      trend = "increasing";
    } else if (recentAvg < previousAvg - 5) {
      trend = "decreasing";
    }
  }

  return {
    average_score: average,
    highest_score: highest,
    lowest_score: lowest,
    score_trend: trend,
    evaluation_count: timeSeriesData.length,
  };
}
