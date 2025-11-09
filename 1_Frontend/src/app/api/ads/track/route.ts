// P4BA9: Advertisement Tracking API
// Public endpoint for tracking ad impressions and clicks

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordAdImpression, recordAdClick } from '@/lib/ads/placement-manager';

const trackAdSchema = z.object({
  ad_id: z.string().uuid('올바른 광고 ID를 입력해주세요'),
  event: z.enum(['impression', 'click'], {
    errorMap: () => ({ message: '이벤트는 impression 또는 click이어야 합니다' }),
  }),
});

/**
 * POST /api/ads/track
 * 광고 노출 또는 클릭 추적 (공개 API)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 검증
    const body = await request.json();
    const validated = trackAdSchema.parse(body);

    // 2. 이벤트 타입에 따라 처리
    if (validated.event === 'impression') {
      await recordAdImpression(validated.ad_id);
    } else if (validated.event === 'click') {
      await recordAdClick(validated.ad_id);
    }

    return NextResponse.json(
      {
        success: true,
        message: '추적 완료',
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
            message: '입력 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/ads/track] Unexpected error:', error);
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
