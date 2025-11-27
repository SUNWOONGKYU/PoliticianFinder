// Related Politicians API - 관련 정치인 추천
// 같은 정당, 같은 지역, 비슷한 점수대의 정치인 추천

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapPoliticianListFieldsWithScore } from "@/utils/fieldMapper";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const politicianId = params.id;

    if (!politicianId) {
      return NextResponse.json(
        {
          success: false,
          error: "정치인 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 대상 정치인 정보 조회
    const { data: targetPolitician, error: targetError } = await supabase
      .from("politicians")
      .select("id, party, region, district")
      .eq("id", politicianId)
      .single();

    if (targetError || !targetPolitician) {
      return NextResponse.json(
        {
          success: false,
          error: "정치인을 찾을 수 없습니다.",
          details: targetError?.message,
        },
        { status: 404 }
      );
    }

    // 2. 대상 정치인의 AI 점수 조회
    const { data: targetScore } = await supabase
      .from("ai_final_scores")
      .select("total_score")
      .eq("politician_id", politicianId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const targetTotalScore = targetScore?.total_score || 0;
    const scoreRange = 10; // ±10점 범위

    // 3. 관련 정치인 조회 쿼리
    // 우선순위: 같은 정당 > 같은 지역 > 비슷한 점수대
    let queryBuilder = supabase
      .from("politicians")
      .select("*")
      .neq("id", politicianId); // 자기 자신 제외

    // 같은 정당 우선
    if (targetPolitician.party) {
      queryBuilder = queryBuilder.eq("party", targetPolitician.party);
    }

    // 활성 정치인만
    queryBuilder = queryBuilder.eq("is_active", true);

    // 최대 20명 조회 (점수 필터링 후 4명으로 축소)
    queryBuilder = queryBuilder.limit(20);

    const { data: relatedPoliticians, error: relatedError } = await queryBuilder;

    if (relatedError) {
      console.error("Related politicians query error:", relatedError);
      return NextResponse.json(
        {
          success: false,
          error: "관련 정치인 조회 중 오류가 발생했습니다.",
          details: relatedError.message,
        },
        { status: 500 }
      );
    }

    if (!relatedPoliticians || relatedPoliticians.length === 0) {
      // 같은 정당이 없으면 같은 지역으로 재시도
      let fallbackQuery = supabase
        .from("politicians")
        .select("*")
        .neq("id", politicianId)
        .eq("is_active", true);

      if (targetPolitician.region) {
        fallbackQuery = fallbackQuery.eq("region", targetPolitician.region);
      }

      fallbackQuery = fallbackQuery.limit(20);

      const { data: fallbackPoliticians, error: fallbackError } = await fallbackQuery;

      if (fallbackError || !fallbackPoliticians || fallbackPoliticians.length === 0) {
        return NextResponse.json(
          {
            success: true,
            data: [],
            message: "관련 정치인을 찾을 수 없습니다.",
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      relatedPoliticians.push(...fallbackPoliticians);
    }

    // 4. 관련 정치인들의 AI 점수 조회
    const politicianIds = relatedPoliticians.map((p: any) => p.id);
    const { data: scores } = await supabase
      .from("ai_final_scores")
      .select("politician_id, total_score, updated_at")
      .in("politician_id", politicianIds);

    // 점수 맵 생성 (최신 점수만 사용)
    const scoresMap: Record<string, { total_score: number; updated_at: string }> = {};
    if (scores) {
      scores.forEach((score: any) => {
        const existing = scoresMap[score.politician_id];
        if (!existing || new Date(score.updated_at) > new Date(existing.updated_at)) {
          scoresMap[score.politician_id] = {
            total_score: score.total_score,
            updated_at: score.updated_at,
          };
        }
      });
    }

    // 5. 점수와 우선순위에 따른 정렬 및 필터링
    const scoredPoliticians = relatedPoliticians.map((p: any) => {
      const scoreData = scoresMap[p.id];
      const totalScore = scoreData?.total_score || 0;

      // 우선순위 계산
      let priority = 0;
      if (p.party === targetPolitician.party) priority += 100;
      if (p.region === targetPolitician.region) priority += 50;
      if (p.district === targetPolitician.district) priority += 25;

      // 점수 차이가 작을수록 우선순위 높음
      const scoreDiff = Math.abs(totalScore - targetTotalScore);
      priority += Math.max(0, 100 - scoreDiff);

      return {
        ...p,
        totalScore,
        priority,
        scoreDiff,
      };
    });

    // 우선순위 정렬 및 상위 4명 선택
    const topRelated = scoredPoliticians
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);

    // 6. 필드 매핑
    const mappedPoliticians = topRelated.map((p: any) =>
      mapPoliticianListFieldsWithScore(p, p.totalScore)
    );

    return NextResponse.json(
      {
        success: true,
        data: mappedPoliticians,
        meta: {
          targetPolitician: {
            id: targetPolitician.id,
            party: targetPolitician.party,
            region: targetPolitician.region,
            score: targetTotalScore,
          },
          count: mappedPoliticians.length,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Related Politicians API] Error:", error);
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
