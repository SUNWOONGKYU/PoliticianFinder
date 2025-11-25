// Task ID: P4BA19
// POST /api/evaluations/compare - 정치인 간 비교 API (레이더 차트 데이터)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * POST /api/evaluations/compare
 * 2~5명의 정치인을 동시 비교
 *
 * Request Body:
 * {
 *   "politician_ids": ["uuid1", "uuid2", "uuid3", ...],
 *   "limit": 5  // 최근 N개 평가 평균 (기본값: 5)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Parse and validate request body
    const body = await request.json();
    const { politician_ids, limit = 5 } = body;

    // Validate politician_ids
    if (!politician_ids || !Array.isArray(politician_ids)) {
      return NextResponse.json(
        { success: false, error: "politician_ids must be an array" },
        { status: 400 }
      );
    }

    if (politician_ids.length < 2 || politician_ids.length > 5) {
      return NextResponse.json(
        { success: false, error: "politician_ids must contain 2-5 UUIDs" },
        { status: 400 }
      );
    }

    // Validate limit
    const evaluationLimit = Math.min(Math.max(parseInt(limit), 1), 20);

    // 2. Fetch each politician's data and recent evaluations
    const comparisons = await Promise.all(
      politician_ids.map(async (id: string) => {
        // Fetch politician info
        const { data: politician, error: politicianError } = await supabase
          .from("politicians")
          .select("id, name, party, position, profile_image")
          .eq("id", id)
          .single();

        if (politicianError || !politician) {
          return null;
        }

        // Fetch recent evaluations
        const { data: evaluations, error: evaluationsError } = await supabase
          .from("ai_evaluations")
          .select("*")
          .eq("politician_id", id)
          .order("created_at", { ascending: false })
          .limit(evaluationLimit);

        if (evaluationsError || !evaluations || evaluations.length === 0) {
          return {
            politician,
            scores: null,
            evaluation_count: 0,
          };
        }

        // 3. Calculate average scores from recent evaluations
        const avgScores = calculateAverageScores(evaluations);

        return {
          politician,
          scores: avgScores,
          evaluation_count: evaluations.length,
        };
      })
    );

    // 4. Filter out null results (politicians not found)
    const validComparisons = comparisons.filter((c) => c !== null);

    if (validComparisons.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 valid politicians are required for comparison" },
        { status: 400 }
      );
    }

    // 5. Calculate rankings
    const rankedComparisons = calculateRankings(validComparisons);

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          total_compared: rankedComparisons.length,
          evaluation_limit: evaluationLimit,
          comparisons: rankedComparisons,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 3 minutes
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=360",
        },
      }
    );
  } catch (error) {
    console.error("POST /api/evaluations/compare error:", error);
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
 * Calculate average scores from evaluations
 */
function calculateAverageScores(evaluations: any[]) {
  if (evaluations.length === 0) {
    return null;
  }

  // Calculate overall score average
  const overallScores = evaluations.map((e) => e.overall_score || 0);
  const overallAvg = Math.round(overallScores.reduce((a, b) => a + b, 0) / evaluations.length);

  // Extract and average detailed criteria scores
  const criteriaScores = {
    integrity: [] as number[],
    expertise: [] as number[],
    communication: [] as number[],
    leadership: [] as number[],
    transparency: [] as number[],
    responsiveness: [] as number[],
    innovation: [] as number[],
    collaboration: [] as number[],
    constituency_service: [] as number[],
    policy_impact: [] as number[],
  };

  evaluations.forEach((evaluation) => {
    const analysis = evaluation.detailed_analysis || {};

    criteriaScores.integrity.push(analysis.integrity_score || 0);
    criteriaScores.expertise.push(analysis.expertise_score || 0);
    criteriaScores.communication.push(analysis.communication_score || 0);
    criteriaScores.leadership.push(analysis.leadership_score || 0);
    criteriaScores.transparency.push(analysis.transparency_score || 0);
    criteriaScores.responsiveness.push(analysis.responsiveness_score || 0);
    criteriaScores.innovation.push(analysis.innovation_score || 0);
    criteriaScores.collaboration.push(analysis.collaboration_score || 0);
    criteriaScores.constituency_service.push(analysis.constituency_service_score || 0);
    criteriaScores.policy_impact.push(analysis.policy_impact_score || 0);
  });

  // Calculate averages for each criterion
  const avgCriteria = {
    integrity: Math.round(criteriaScores.integrity.reduce((a, b) => a + b, 0) / evaluations.length),
    expertise: Math.round(criteriaScores.expertise.reduce((a, b) => a + b, 0) / evaluations.length),
    communication: Math.round(criteriaScores.communication.reduce((a, b) => a + b, 0) / evaluations.length),
    leadership: Math.round(criteriaScores.leadership.reduce((a, b) => a + b, 0) / evaluations.length),
    transparency: Math.round(criteriaScores.transparency.reduce((a, b) => a + b, 0) / evaluations.length),
    responsiveness: Math.round(criteriaScores.responsiveness.reduce((a, b) => a + b, 0) / evaluations.length),
    innovation: Math.round(criteriaScores.innovation.reduce((a, b) => a + b, 0) / evaluations.length),
    collaboration: Math.round(criteriaScores.collaboration.reduce((a, b) => a + b, 0) / evaluations.length),
    constituency_service: Math.round(criteriaScores.constituency_service.reduce((a, b) => a + b, 0) / evaluations.length),
    policy_impact: Math.round(criteriaScores.policy_impact.reduce((a, b) => a + b, 0) / evaluations.length),
  };

  return {
    overall: overallAvg,
    ...avgCriteria,
  };
}

/**
 * Calculate rankings based on overall scores
 */
function calculateRankings(comparisons: any[]) {
  // Sort by overall score (descending)
  const sorted = [...comparisons].sort((a, b) => {
    const scoreA = a.scores?.overall || 0;
    const scoreB = b.scores?.overall || 0;
    return scoreB - scoreA;
  });

  // Add rank to each comparison
  return sorted.map((comparison, index) => ({
    rank: index + 1,
    ...comparison,
  }));
}
