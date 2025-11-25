// P3BA4: Real API - Politicians Statistics (Supabase Integration)
// 정치인 통계 API - 실시간 Supabase 데이터 연동

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/statistics/politicians-stats
 * 정치인 관련 통계 데이터 조회
 * - 정치인 수 (전체/활성/검증)
 * - 정당별 분포
 * - 지역별 분포
 * - 직책별 분포
 * - 인기 정치인
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 기본 통계
    const [
      { count: totalPoliticians },
      { count: verifiedPoliticians },
      { count: activePoliticians },
      { data: politicians },
    ] = await Promise.all([
      // 총 정치인 수
      supabase.from('politicians').select('*', { count: 'exact', head: true }),

      // 검증된 정치인 수
      supabase
        .from('politicians')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true),

      // 활성 정치인 수 (조회수 10 이상)
      supabase
        .from('politicians')
        .select('*', { count: 'exact', head: true })
        .gte('view_count', 10),

      // 정치인 데이터 (분포 분석용)
      supabase
        .from('politicians')
        .select('party, position, region, district, view_count, favorite_count, evaluation_score'),
    ]);

    // 정당별 분포
    const partyDistribution = (politicians || []).reduce((acc, p) => {
      const party = p.party || '무소속';
      acc[party] = (acc[party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 지역별 분포
    const regionDistribution = (politicians || []).reduce((acc, p) => {
      const region = p.region || '기타';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 직책별 분포
    const positionDistribution = (politicians || []).reduce((acc, p) => {
      const position = p.position || '기타';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 평균 통계
    const totalViewCount = (politicians || []).reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalFavoriteCount = (politicians || []).reduce((sum, p) => sum + (p.favorite_count || 0), 0);
    const totalEvaluationScore = (politicians || []).reduce((sum, p) => sum + (p.evaluation_score || 0), 0);

    const avgViewCount = totalPoliticians
      ? Math.round(totalViewCount / totalPoliticians)
      : 0;
    const avgFavoriteCount = totalPoliticians
      ? Math.round(totalFavoriteCount / totalPoliticians * 100) / 100
      : 0;
    const avgEvaluationScore = totalPoliticians
      ? Math.round(totalEvaluationScore / totalPoliticians * 100) / 100
      : 0;

    // 인기 정치인 Top 10 (조회수 기준)
    const { data: topByViews } = await supabase
      .from('politicians')
      .select('id, name, party, position, region, view_count, favorite_count, profile_image_url')
      .order('view_count', { ascending: false })
      .limit(10);

    // 인기 정치인 Top 10 (즐겨찾기 기준)
    const { data: topByFavorites } = await supabase
      .from('politicians')
      .select('id, name, party, position, region, view_count, favorite_count, profile_image_url')
      .order('favorite_count', { ascending: false })
      .limit(10);

    // 평가 높은 정치인 Top 10
    const { data: topByRating } = await supabase
      .from('politicians')
      .select('id, name, party, position, region, evaluation_score, evaluation_grade, profile_image_url')
      .order('evaluation_score', { ascending: false })
      .limit(10);

    // 최근 가입 정치인
    const { data: recentPoliticians } = await supabase
      .from('politicians')
      .select('id, name, party, position, region, created_at, profile_image_url')
      .order('created_at', { ascending: false })
      .limit(10);

    // 응답 데이터 구성
    const statistics = {
      summary: {
        total: totalPoliticians || 0,
        verified: verifiedPoliticians || 0,
        active: activePoliticians || 0,
        verificationRate: totalPoliticians
          ? Math.round((verifiedPoliticians || 0) / totalPoliticians * 100)
          : 0,
      },
      distribution: {
        byParty: Object.entries(partyDistribution)
          .map(([party, count]) => ({ party, count }))
          .sort((a, b) => b.count - a.count),
        byRegion: Object.entries(regionDistribution)
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count),
        byPosition: Object.entries(positionDistribution)
          .map(([position, count]) => ({ position, count }))
          .sort((a, b) => b.count - a.count),
      },
      averages: {
        viewCount: avgViewCount,
        favoriteCount: avgFavoriteCount,
        evaluationScore: avgEvaluationScore,
      },
      rankings: {
        topByViews: topByViews || [],
        topByFavorites: topByFavorites || [],
        topByRating: topByRating || [],
        recent: recentPoliticians || [],
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/statistics/politicians-stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
