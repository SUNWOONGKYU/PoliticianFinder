// P4BA9: Advertisement Statistics API
// Admin-only endpoint for viewing ad statistics

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';

const statsQuerySchema = z.object({
  placement: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

/**
 * GET /api/admin/ads/stats
 * 광고 통계 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 2. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      placement: searchParams.get('placement') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };

    const query = statsQuerySchema.parse(queryParams);

    // 3. Supabase 클라이언트 생성
    const supabase = createClient();

    // 4. 쿼리 빌더 시작
    let queryBuilder = supabase
      .from('advertisements')
      .select('*');

    // 5. 필터 적용
    if (query.placement) {
      queryBuilder = queryBuilder.eq('placement', query.placement);
    }

    if (query.start_date) {
      queryBuilder = queryBuilder.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      queryBuilder = queryBuilder.lte('created_at', query.end_date);
    }

    // 6. 데이터 가져오기
    const { data: ads, error } = await queryBuilder;

    if (error) {
      console.error('[GET /api/admin/ads/stats] Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '광고 통계 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 7. 통계 계산
    const totalAds = ads?.length || 0;
    const activeAds = ads?.filter((ad) => ad.is_active).length || 0;
    const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0;
    const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // 8. 배치별 통계
    const placementStats = ['main', 'sidebar', 'post_top', 'post_bottom'].map((placement) => {
      const placementAds = ads?.filter((ad) => ad.placement === placement) || [];
      const impressions = placementAds.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
      const clicks = placementAds.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        placement,
        totalAds: placementAds.length,
        activeAds: placementAds.filter((ad) => ad.is_active).length,
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(2)),
      };
    });

    // 9. 상위 성과 광고 (CTR 기준)
    const topPerformingAds = ads
      ?.map((ad) => ({
        id: ad.id,
        title: ad.title,
        placement: ad.placement,
        impressions: ad.impressions || 0,
        clicks: ad.clicks || 0,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalAds,
            activeAds,
            inactiveAds: totalAds - activeAds,
            totalImpressions,
            totalClicks,
            avgCTR: parseFloat(avgCTR.toFixed(2)),
          },
          byPlacement: placementStats,
          topPerforming: topPerformingAds.map((ad) => ({
            ...ad,
            ctr: parseFloat(ad.ctr.toFixed(2)),
          })),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[GET /api/admin/ads/stats] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
