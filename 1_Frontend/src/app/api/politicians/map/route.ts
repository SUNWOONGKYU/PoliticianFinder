// 지역별 정치인 랭킹 API
// 지도 기능용: 각 지역에서 AI 평가 점수 또는 여론조사 기준 1위·2위 정치인 반환

export const dynamic = 'force-dynamic';

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
    const viewMode = searchParams.get('view_mode') || 'ai'; // 'ai' | 'poll'

    // title 컬럼에 출마직종 저장 (fieldMapper.ts 참고: positionType = dbRecord.title)
    const { data: politicians, error: queryError } = await supabase
      .from('politicians')
      .select('id, name, party, region, district, title, poll_rank, poll_support')
      .eq('title', positionType);

    if (queryError) {
      console.error('Map API query error:', queryError.message);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (politicians.length === 0) {
      return NextResponse.json({ success: true, positionType, viewMode, regions: [] });
    }

    let sorted: any[];

    if (viewMode === 'poll') {
      // 여론조사 모드: poll_rank 있는 것만, poll_rank 오름차순
      sorted = politicians
        .filter((p) => p.poll_rank != null)
        .sort((a, b) => (a.poll_rank || 999) - (b.poll_rank || 999));
    } else {
      // AI 점수 모드 (기본)
      const politicianIds = politicians.map((p) => p.id);
      const { data: scores } = await supabase
        .from('ai_final_scores')
        .select('politician_id, ai_name, total_score')
        .in('politician_id', politicianIds);

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

      sorted = politicians.map((p) => {
        const s = scoreMap[p.id];
        return { ...p, totalScore: s && s.count > 0 ? Math.round(s.sum / s.count) : 0 };
      }).sort((a, b) => b.totalScore - a.totalScore);
    }

    // 지역별 상위 2명 추출
    const regionMap = new Map<string, { region: string; district: string | null; top: any[] }>();
    for (const p of sorted) {
      const key = positionType === '광역단체장' ? p.region : `${p.region}_${p.district || ''}`;
      if (!regionMap.has(key)) {
        regionMap.set(key, { region: p.region || '', district: p.district || null, top: [] });
      }
      const entry = regionMap.get(key)!;
      if (entry.top.length < 2) {
        entry.top.push({
          id: p.id,
          name: p.name,
          party: p.party || '무소속',
          totalScore: p.totalScore || 0,
          pollRank: p.poll_rank || null,
          pollSupport: p.poll_support || null,
        });
      }
    }

    const regions = Array.from(regionMap.values()).map(({ region, district, top }) => ({
      region,
      district,
      first: top[0] || null,
      second: top[1] || null,
    }));

    return NextResponse.json({ success: true, positionType, viewMode, regions });

  } catch (err) {
    console.error('Map API unexpected error:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
