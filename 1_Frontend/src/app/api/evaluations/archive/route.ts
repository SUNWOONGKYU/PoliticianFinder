// Task ID: P4BA19
// POST /api/evaluations/archive - 평가 아카이브 (스냅샷 생성)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * POST /api/evaluations/archive
 * 평가 스냅샷 생성 (월 1회 실행, 크론잡 또는 수동 실행)
 *
 * Request Body (optional):
 * {
 *   "snapshot_date": "2025-11-01",  // 스냅샷 날짜 (기본값: 오늘)
 *   "days_lookback": 30             // 스냅샷 생성 시 참조할 평가 일수 (기본값: 30)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse request body (optional parameters)
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON - use defaults
    }

    const snapshotDate = body.snapshot_date || new Date().toISOString().split('T')[0];
    const daysLookback = Math.min(parseInt(body.days_lookback || "30"), 90);

    // 3. Fetch all politicians
    const { data: politicians, error: politiciansError } = await supabase
      .from("politicians")
      .select("id");

    if (politiciansError || !politicians || politicians.length === 0) {
      return NextResponse.json(
        { success: false, error: "No politicians found" },
        { status: 404 }
      );
    }

    // 4. Calculate lookback date
    const lookbackDate = new Date(snapshotDate);
    lookbackDate.setDate(lookbackDate.getDate() - daysLookback);
    const lookbackDateStr = lookbackDate.toISOString();

    // 5. Create snapshots for each politician
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const politician of politicians) {
      try {
        // Fetch recent evaluations for this politician
        const { data: evaluations, error: evaluationsError } = await supabase
          .from("ai_evaluations")
          .select("*")
          .eq("politician_id", politician.id)
          .gte("created_at", lookbackDateStr)
          .lte("created_at", new Date(snapshotDate).toISOString());

        if (evaluationsError) {
          results.failed++;
          results.errors.push(`Failed to fetch evaluations for politician ${politician.id}: ${evaluationsError.message}`);
          continue;
        }

        if (!evaluations || evaluations.length === 0) {
          results.skipped++;
          continue;
        }

        // 6. Calculate snapshot data
        const snapshot = calculateSnapshot(politician.id, snapshotDate, evaluations);

        // 7. Upsert snapshot (prevent duplicates)
        const { error: upsertError } = await supabase
          .from("evaluation_snapshots")
          .upsert(snapshot, {
            onConflict: "politician_id,snapshot_date",
          });

        if (upsertError) {
          results.failed++;
          results.errors.push(`Failed to upsert snapshot for politician ${politician.id}: ${upsertError.message}`);
          continue;
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Exception for politician ${politician.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 8. Return summary
    return NextResponse.json(
      {
        success: true,
        data: {
          snapshot_date: snapshotDate,
          days_lookback: daysLookback,
          total_politicians: politicians.length,
          results: {
            success: results.success,
            skipped: results.skipped,
            failed: results.failed,
          },
          errors: results.errors.length > 0 ? results.errors : undefined,
        },
        message: `Snapshot created: ${results.success}/${politicians.length} politicians`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/evaluations/archive error:", error);
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
 * Calculate snapshot data from evaluations
 */
function calculateSnapshot(politicianId: string, snapshotDate: string, evaluations: any[]) {
  // Overall scores
  const overallScores = evaluations.map((e) => e.overall_score || 0).filter((s) => s > 0);
  const overallAvg = overallScores.length > 0
    ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
    : 0;
  const overallMax = overallScores.length > 0 ? Math.max(...overallScores) : 0;
  const overallMin = overallScores.length > 0 ? Math.min(...overallScores) : 0;

  // AI model-specific scores (latest for each model)
  const modelScores: { [key: string]: number | null } = {
    claude: null,
    chatgpt: null,
    gemini: null,
    grok: null,
    perplexity: null,
  };

  evaluations.forEach((evaluation) => {
    const modelVersion = evaluation.ai_model_version || "";
    const score = evaluation.overall_score || 0;

    if (modelVersion.toLowerCase().includes("claude") && !modelScores.claude) {
      modelScores.claude = score;
    } else if (modelVersion.toLowerCase().includes("chatgpt") && !modelScores.chatgpt) {
      modelScores.chatgpt = score;
    } else if (modelVersion.toLowerCase().includes("gemini") && !modelScores.gemini) {
      modelScores.gemini = score;
    } else if (modelVersion.toLowerCase().includes("grok") && !modelScores.grok) {
      modelScores.grok = score;
    } else if (modelVersion.toLowerCase().includes("perplexity") && !modelScores.perplexity) {
      modelScores.perplexity = score;
    }
  });

  // Criteria averages
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

  // Calculate averages
  const calculateAvg = (scores: number[]) => {
    const validScores = scores.filter((s) => s > 0);
    return validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;
  };

  return {
    politician_id: politicianId,
    snapshot_date: snapshotDate,

    // Overall scores
    overall_score_avg: Math.round(overallAvg * 100) / 100,
    overall_score_max: overallMax,
    overall_score_min: overallMin,

    // AI model scores
    claude_score: modelScores.claude,
    chatgpt_score: modelScores.chatgpt,
    gemini_score: modelScores.gemini,
    grok_score: modelScores.grok,
    perplexity_score: modelScores.perplexity,

    // Criteria averages
    integrity_avg: Math.round(calculateAvg(criteriaScores.integrity) * 100) / 100,
    expertise_avg: Math.round(calculateAvg(criteriaScores.expertise) * 100) / 100,
    communication_avg: Math.round(calculateAvg(criteriaScores.communication) * 100) / 100,
    leadership_avg: Math.round(calculateAvg(criteriaScores.leadership) * 100) / 100,
    transparency_avg: Math.round(calculateAvg(criteriaScores.transparency) * 100) / 100,
    responsiveness_avg: Math.round(calculateAvg(criteriaScores.responsiveness) * 100) / 100,
    innovation_avg: Math.round(calculateAvg(criteriaScores.innovation) * 100) / 100,
    collaboration_avg: Math.round(calculateAvg(criteriaScores.collaboration) * 100) / 100,
    constituency_service_avg: Math.round(calculateAvg(criteriaScores.constituency_service) * 100) / 100,
    policy_impact_avg: Math.round(calculateAvg(criteriaScores.policy_impact) * 100) / 100,

    // Evaluation count
    evaluation_count: evaluations.length,
  };
}
