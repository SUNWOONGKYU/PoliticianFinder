// 지역별 정치인 랭킹 API
// 지도 기능용: 각 지역에서 AI 평가 점수 1위 정치인 반환

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const positionType = searchParams.get('position_type') || '광역단체장';

    // 해당 출마직종의 정치인 전체 조회
    const { data: politicians, error: polError } = await supabase
      .from('politicians')
      .select('id, name, party, region, district, title, position_type')
      .or(`position_type.eq.${positionType},title.eq.${positionType}`);

    if (polError) {
      console.error('Map API politicians query error:', polError);
      return NextResponse.json({ success: false, error: polError.message }, { status: 500 });
    }

    if (!politicians || politicians.length === 0) {
      return NextResponse.json({
        success: true,
        positionType,
        regions: [],
      });
    }

    // AI 최종 점수 조회
    const politicianIds = politicians.map((p: any) => p.id);
    const { data: scores, error: scoreError } = await supabase
      .from('ai_final_scores')
      .select('politician_id, ai_name, total_score')
      .in('politician_id', politicianIds);

    if (scoreError) {
      console.error('Map API scores query error:', scoreError);
    }

    // 정치인별 AI 복합 점수 계산
    const scoreMap: Record<string, { sum: number; count: number }> = {};
    for (const score of (scores || [])) {
      if (!scoreMap[score.politician_id]) {
        scoreMap[score.politician_id] = { sum: 0, count: 0 };
      }
      if (score.total_score > 0) {
        scoreMap[score.politician_id].sum += score.total_score;
        scoreMap[score.politician_id].count++;
      }
    }

    // 점수 포함한 정치인 목록 생성 후 내림차순 정렬
    const politiciansWithScore = politicians.map((p: any) => {
      const s = scoreMap[p.id];
      const totalScore = s && s.count > 0 ? Math.round(s.sum / s.count) : 0;
      return { ...p, totalScore };
    }).sort((a: any, b: any) => b.totalScore - a.totalScore);

    // 지역별로 그룹핑 (1위만 추출)
    const regionMap = new Map<string, any>();
    for (const p of politiciansWithScore) {
      const regionKey = positionType === '광역단체장' ? p.region : `${p.region}_${p.district || ''}`;
      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, {
          region: p.region || '',
          district: p.district || null,
          topPolitician: {
            id: p.id,
            name: p.name,
            party: p.party || '무소속',
            totalScore: p.totalScore,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      positionType,
      regions: Array.from(regionMap.values()),
    });

  } catch (error) {
    console.error('Map API error:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
