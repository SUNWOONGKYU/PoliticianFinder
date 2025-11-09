// Task ID: P4BA19
// GET /api/evaluations/trends - 점수 변화 추이 API (시계열 차트 데이터)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/evaluations/trends
 * 시계열 차트 데이터 조회 (스냅샷 기반)
 *
 * Query Parameters:
 * - politician_id: 정치인 ID (필수)
 * - days: 조회 일수 (기본값: 90, 최대: 365)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const politicianId = searchParams.get("politician_id");
    const daysParam = searchParams.get("days");

    // 1. Validate required parameters
    if (!politicianId) {
      return NextResponse.json(
        { success: false, error: "politician_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 2. Verify politician exists
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

    // 3. Calculate date range (default: 90 days, max: 365)
    const days = Math.min(parseInt(daysParam || "90"), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // 4. Fetch snapshot data
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("evaluation_snapshots")
      .select("*")
      .eq("politician_id", politicianId)
      .gte("snapshot_date", startDateStr)
      .order("snapshot_date", { ascending: true });

    if (snapshotsError) {
      console.error("Snapshots query error:", snapshotsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch trend data" },
        { status: 500 }
      );
    }

    // 5. Format chart data
    const chartData = (snapshots || []).map((snapshot) => ({
      date: snapshot.snapshot_date,
      overall: snapshot.overall_score_avg ? parseFloat(snapshot.overall_score_avg.toString()) : 0,
      claude: snapshot.claude_score || null,
      chatgpt: snapshot.chatgpt_score || null,
      gemini: snapshot.gemini_score || null,
      grok: snapshot.grok_score || null,
      perplexity: snapshot.perplexity_score || null,

      // Criteria averages for detailed charts
      criteria: {
        integrity: snapshot.integrity_avg ? parseFloat(snapshot.integrity_avg.toString()) : 0,
        expertise: snapshot.expertise_avg ? parseFloat(snapshot.expertise_avg.toString()) : 0,
        communication: snapshot.communication_avg ? parseFloat(snapshot.communication_avg.toString()) : 0,
        leadership: snapshot.leadership_avg ? parseFloat(snapshot.leadership_avg.toString()) : 0,
        transparency: snapshot.transparency_avg ? parseFloat(snapshot.transparency_avg.toString()) : 0,
        responsiveness: snapshot.responsiveness_avg ? parseFloat(snapshot.responsiveness_avg.toString()) : 0,
        innovation: snapshot.innovation_avg ? parseFloat(snapshot.innovation_avg.toString()) : 0,
        collaboration: snapshot.collaboration_avg ? parseFloat(snapshot.collaboration_avg.toString()) : 0,
        constituency_service: snapshot.constituency_service_avg ? parseFloat(snapshot.constituency_service_avg.toString()) : 0,
        policy_impact: snapshot.policy_impact_avg ? parseFloat(snapshot.policy_impact_avg.toString()) : 0,
      },

      evaluation_count: snapshot.evaluation_count || 0,
    }));

    // 6. Calculate trend statistics
    const stats = calculateTrendStatistics(chartData);

    // 7. Return response
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
            start_date: startDateStr,
            end_date: new Date().toISOString().split('T')[0],
            days: days,
          },
          total_snapshots: chartData.length,
          chart_data: chartData,
          statistics: stats,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 10 minutes
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/evaluations/trends error:", error);
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
 * Calculate trend statistics
 */
function calculateTrendStatistics(chartData: any[]) {
  if (chartData.length === 0) {
    return {
      average_overall: 0,
      highest_overall: 0,
      lowest_overall: 0,
      change_rate: 0,
      trend_direction: "stable",
    };
  }

  const overallScores = chartData.map((d) => d.overall).filter((s) => s > 0);

  if (overallScores.length === 0) {
    return {
      average_overall: 0,
      highest_overall: 0,
      lowest_overall: 0,
      change_rate: 0,
      trend_direction: "stable",
    };
  }

  const sum = overallScores.reduce((acc, score) => acc + score, 0);
  const average = Math.round((sum / overallScores.length) * 100) / 100;
  const highest = Math.max(...overallScores);
  const lowest = Math.min(...overallScores);

  // Calculate change rate (first to last)
  const firstScore = overallScores[0];
  const lastScore = overallScores[overallScores.length - 1];
  const changeRate = ((lastScore - firstScore) / firstScore) * 100;

  // Determine trend direction
  let trendDirection = "stable";
  if (changeRate > 5) {
    trendDirection = "increasing";
  } else if (changeRate < -5) {
    trendDirection = "decreasing";
  }

  return {
    average_overall: average,
    highest_overall: highest,
    lowest_overall: lowest,
    change_rate: Math.round(changeRate * 100) / 100,
    trend_direction: trendDirection,
  };
}
