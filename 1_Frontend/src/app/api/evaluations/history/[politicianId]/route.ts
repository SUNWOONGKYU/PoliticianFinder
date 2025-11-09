// Task ID: P4BA19
// GET /api/evaluations/history/[politicianId] - 정치인별 평가 이력 조회

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/evaluations/history/[politicianId]
 * 특정 정치인의 전체 평가 이력 조회
 *
 * Query Parameters:
 * - days: 조회 일수 (30, 90, 365) - 기본값: 30
 * - evaluator: AI 모델 필터 (claude, chatgpt, gemini, grok, perplexity)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { politicianId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const politicianId = params.politicianId;

    // Query parameters
    const daysParam = searchParams.get("days");
    const evaluator = searchParams.get("evaluator");

    // Validate politician ID
    if (!politicianId) {
      return NextResponse.json(
        { success: false, error: "politician_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Verify politician exists
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("id, name, party, position")
      .eq("id", politicianId)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "Politician not found" },
        { status: 404 }
      );
    }

    // 2. Calculate date range (default: 30 days, max: 365)
    const days = Math.min(parseInt(daysParam || "30"), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 3. Build query for evaluation history
    let query = supabase
      .from("ai_evaluations")
      .select("*")
      .eq("politician_id", politicianId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    // Filter by AI model/evaluator if specified
    if (evaluator) {
      query = query.ilike("ai_model_version", `${evaluator}%`);
    }

    const { data: evaluations, error: evaluationsError } = await query;

    if (evaluationsError) {
      console.error("Evaluations history query error:", evaluationsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch evaluation history" },
        { status: 500 }
      );
    }

    // 4. Calculate statistics
    const stats = calculateStatistics(evaluations || []);

    // 5. Format response data
    const formattedEvaluations = (evaluations || []).map((evaluation) => {
      const detailedAnalysis = evaluation.detailed_analysis || {};

      return {
        id: evaluation.id,
        evaluation_date: evaluation.evaluation_date,
        created_at: evaluation.created_at,
        ai_model_version: evaluation.ai_model_version || "Unknown",
        overall_score: evaluation.overall_score || 0,
        overall_grade: evaluation.overall_grade || "N/A",

        // Detailed scores
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
        sources: evaluation.sources || [],
      };
    });

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          politician: {
            id: politician.id,
            name: politician.name,
            party: politician.party,
            position: politician.position,
          },
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            days: days,
          },
          filters: {
            evaluator: evaluator || "all",
          },
          total_evaluations: formattedEvaluations.length,
          evaluations: formattedEvaluations,
          statistics: stats,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/evaluations/history/[politicianId] error:", error);
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
 * Calculate statistics from evaluation history
 */
function calculateStatistics(evaluations: any[]) {
  if (evaluations.length === 0) {
    return {
      count: 0,
      average_score: 0,
      max_score: 0,
      min_score: 0,
      latest_score: 0,
      score_change: 0,
      trend: "stable",
    };
  }

  const scores = evaluations.map((e) => e.overall_score || 0);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const average = Math.round((sum / scores.length) * 100) / 100;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const latest = scores[0];
  const change = scores.length > 1 ? latest - scores[scores.length - 1] : 0;

  // Calculate trend (recent 5 vs previous 5)
  let trend = "stable";
  if (evaluations.length >= 10) {
    const recentScores = scores.slice(0, 5);
    const previousScores = scores.slice(5, 10);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / 5;
    const previousAvg = previousScores.reduce((a, b) => a + b, 0) / 5;

    if (recentAvg > previousAvg + 5) {
      trend = "increasing";
    } else if (recentAvg < previousAvg - 5) {
      trend = "decreasing";
    }
  }

  return {
    count: evaluations.length,
    average_score: average,
    max_score: max,
    min_score: min,
    latest_score: latest,
    score_change: change,
    trend,
  };
}
