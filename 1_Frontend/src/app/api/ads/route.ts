// P4BA9: Public Advertisement API
// Public endpoint for fetching active ads

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveAdsForPlacement, recordAdImpression } from '@/lib/ads/placement-manager';
import type { AdPlacement } from '@/lib/ads/placement-manager';

const getAdsQuerySchema = z.object({
  placement: z.enum(['main', 'sidebar', 'post_top', 'post_bottom'], {
    errorMap: () => ({ message: '올바른 노출 위치를 선택해주세요' }),
  }),
});

/**
 * GET /api/ads?placement={placement}
 * 특정 위치의 활성 광고 조회 (공개 API)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'placement 파라미터가 필요합니다.',
          },
        },
        { status: 400 }
      );
    }

    const query = getAdsQuerySchema.parse({ placement });

    // 2. 활성 광고 가져오기
    const ads = await getActiveAdsForPlacement(query.placement as AdPlacement);

    // 3. 광고가 없으면 빈 배열 반환
    if (ads.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: '현재 노출 가능한 광고가 없습니다.',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // 4. 랜덤 광고 선택 (또는 모든 광고 반환)
    // 여기서는 모든 활성 광고를 반환하되, 프론트엔드에서 선택하도록 함
    return NextResponse.json(
      {
        success: true,
        data: ads,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
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

    console.error('[GET /api/ads] Unexpected error:', error);
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
