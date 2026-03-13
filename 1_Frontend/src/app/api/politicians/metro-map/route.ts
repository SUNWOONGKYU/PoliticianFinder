// 2026 지방선거 광역단체장 출마자 지도 API
// 여론조사 / AI 평가 기준 지역별 상위 5명 반환

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const viewMode = searchParams.get('view_mode') || 'ai'; // 'ai' | 'poll'

  try {
    const { data: politicians, error } = await supabase
      .from('politicians')
      .select('id, name, party, region, title, poll_rank, poll_support')
      .eq('title', '광역단체장');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!politicians || politicians.length === 0) {
      return NextResponse.json({ success: true, viewMode, regions: [] });
    }

    let enriched: any[];

    if (viewMode === 'poll') {
      enriched = politicians
        .map((p) => ({
          id: p.id,
          name: p.name,
          party: p.party || '무소속',
          region: p.region || '기타',
          pollRank: p.poll_rank ?? null,
          pollSupport: p.poll_support ?? null,
          finalScore: 0,
          hasScore: false,
        }))
        .sort((a, b) => {
          // poll_rank 있는 것 먼저, 없으면 뒤로
          if (a.pollRank != null && b.pollRank != null) return a.pollRank - b.pollRank;
          if (a.pollRank != null) return -1;
          if (b.pollRank != null) return 1;
          return 0;
        });
    } else {
      // AI 평가 모드
      const ids = politicians.map((p) => p.id);
      const { data: scores } = await supabase
        .from('ai_final_scores_v40')
        .select('politician_id, final_score')
        .in('politician_id', ids);

      const scoreMap: Record<string, number> = {};
      for (const s of scores || []) {
        scoreMap[s.politician_id] = s.final_score || 0;
      }

      enriched = politicians
        .map((p) => ({
          id: p.id,
          name: p.name,
          party: p.party || '무소속',
          region: p.region || '기타',
          pollRank: p.poll_rank ?? null,
          pollSupport: p.poll_support ?? null,
          finalScore: scoreMap[p.id] || 0,
          hasScore: scoreMap[p.id] != null && scoreMap[p.id] > 0,
        }))
        .sort((a, b) => b.finalScore - a.finalScore);
    }

    // 지역별로 묶어 상위 5명 추출
    const regionMap = new Map<string, any[]>();
    for (const p of enriched) {
      const key = p.region;
      if (!regionMap.has(key)) regionMap.set(key, []);
      const list = regionMap.get(key)!;
      if (list.length < 5) list.push(p);
    }

    // 지역별 전체 인원수도 포함
    const regionTotal = new Map<string, number>();
    for (const p of enriched) {
      regionTotal.set(p.region, (regionTotal.get(p.region) || 0) + 1);
    }

    const regions = Array.from(regionMap.entries()).map(([region, candidates]) => ({
      region,
      total: regionTotal.get(region) || candidates.length,
      candidates,
    }));

    return NextResponse.json({ success: true, viewMode, regions });
  } catch (err) {
    console.error('Metro map API error:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
