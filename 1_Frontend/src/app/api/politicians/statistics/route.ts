// P3BA2: Real API - 정치인 통계 (Supabase Aggregation)
// 정치인 통계 정보 조회 (정당별, 지역별, 직책별)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/politicians/statistics
 * 정치인 통계 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = createClient();

    // 활성 정치인 전체 수
    const { count: totalCount, error: totalError } = await supabase
      .from("politicians")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (totalError) {
      console.error("Supabase total count error:", totalError);
      throw totalError;
    }

    // 검증된 정치인 수
    const { count: verifiedCount, error: verifiedError } = await supabase
      .from("politicians")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .not("verified_at", "is", null);

    if (verifiedError) {
      console.error("Supabase verified count error:", verifiedError);
      throw verifiedError;
    }

    // 정당별 통계 (political_party_id 기준)
    const { data: partyStats, error: partyError } = await supabase
      .from("politicians")
      .select("political_party_id")
      .eq("is_active", true);

    if (partyError) {
      console.error("Supabase party stats error:", partyError);
      throw partyError;
    }

    const partyDistribution = partyStats?.reduce((acc, p) => {
      const partyId = p.political_party_id?.toString() || "unknown";
      acc[partyId] = (acc[partyId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 지역구별 통계 (constituency_id 기준)
    const { data: constituencyStats, error: constituencyError } = await supabase
      .from("politicians")
      .select("constituency_id")
      .eq("is_active", true);

    if (constituencyError) {
      console.error("Supabase constituency stats error:", constituencyError);
      throw constituencyError;
    }

    const constituencyDistribution = constituencyStats?.reduce((acc, p) => {
      const constituencyId = p.constituency_id?.toString() || "unknown";
      acc[constituencyId] = (acc[constituencyId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 직책별 통계 (position_id 기준)
    const { data: positionStats, error: positionError } = await supabase
      .from("politicians")
      .select("position_id")
      .eq("is_active", true);

    if (positionError) {
      console.error("Supabase position stats error:", positionError);
      throw positionError;
    }

    const positionDistribution = positionStats?.reduce((acc, p) => {
      const positionId = p.position_id?.toString() || "unknown";
      acc[positionId] = (acc[positionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // AI 평가가 있는 정치인 수
    const { count: evaluatedCount, error: evaluatedError } = await supabase
      .from("ai_evaluations")
      .select("politician_id", { count: "exact", head: true });

    if (evaluatedError) {
      console.error("Supabase evaluated count error:", evaluatedError);
    }

    // 최근 검증된 정치인 (상위 10명)
    const { data: recentVerified, error: recentVerifiedError } = await supabase
      .from("politicians")
      .select("id, name, name_kana, political_party_id, position_id, verified_at")
      .eq("is_active", true)
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(10);

    if (recentVerifiedError) {
      console.error("Supabase recent verified error:", recentVerifiedError);
      throw recentVerifiedError;
    }

    // 최근 업데이트된 정치인 (상위 10명)
    const { data: recentUpdates, error: recentError } = await supabase
      .from("politicians")
      .select("id, name, name_kana, political_party_id, position_id, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (recentError) {
      console.error("Supabase recent updates error:", recentError);
      throw recentError;
    }

    const statistics = {
      overview: {
        totalPoliticians: totalCount || 0,
        verifiedPoliticians: verifiedCount || 0,
        evaluatedPoliticians: evaluatedCount || 0,
        verificationRate: totalCount
          ? Math.round(((verifiedCount || 0) / totalCount) * 10000) / 100
          : 0,
        evaluationRate: totalCount
          ? Math.round(((evaluatedCount || 0) / totalCount) * 10000) / 100
          : 0,
      },
      distribution: {
        byParty: partyDistribution,
        byConstituency: constituencyDistribution,
        byPosition: positionDistribution,
      },
      recentVerified: recentVerified || [],
      recentUpdates: recentUpdates || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: "Supabase",
        cacheExpiry: new Date(Date.now() + 3600000).toISOString(), // 1시간 캐시
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: statistics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/politicians/statistics error:", error);
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
