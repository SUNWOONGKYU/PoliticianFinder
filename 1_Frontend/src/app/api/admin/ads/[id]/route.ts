// P4BA9: Advertisement Management API - Individual Ad Operations
// Admin-only endpoints for managing individual advertisements

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';

const updateAdSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  image_url: z.string().url().optional(),
  link_url: z.string().url().optional(),
  placement: z.enum(['main', 'sidebar', 'post_top', 'post_bottom']).optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '올바른 시작일을 입력해주세요',
  }).optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '올바른 종료일을 입력해주세요',
  }).optional(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: '종료일은 시작일보다 이후여야 합니다',
    path: ['end_date'],
  }
);

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/ads/[id]
 * 광고 상세 조회 (관리자 전용)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    // 2. UUID 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '올바른 광고 ID가 아닙니다.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 광고 조회
    const { data: ad, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !ad) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '광고를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 5. CTR 계산
    const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...ad,
          ctr: parseFloat(ctr.toFixed(2)),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/admin/ads/[id]] Unexpected error:', error);
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

/**
 * PATCH /api/admin/ads/[id]
 * 광고 수정 (관리자 전용)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    // 2. UUID 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '올바른 광고 ID가 아닙니다.',
          },
        },
        { status: 400 }
      );
    }

    // 3. 요청 데이터 검증
    const body = await request.json();
    const validated = updateAdSchema.parse(body);

    // 4. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 5. 광고 존재 여부 확인
    const { data: existingAd, error: fetchError } = await supabase
      .from('advertisements')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAd) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '광고를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 6. 광고 업데이트
    const { data: updatedAd, error: updateError } = await supabase
      .from('advertisements')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/admin/ads/[id]] Supabase update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '광고 수정 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedAd,
        message: '광고가 성공적으로 수정되었습니다.',
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

    console.error('[PATCH /api/admin/ads/[id]] Unexpected error:', error);
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

/**
 * DELETE /api/admin/ads/[id]
 * 광고 삭제 (소프트 삭제 - is_active = false) (관리자 전용)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    // 2. UUID 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '올바른 광고 ID가 아닙니다.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 광고 존재 여부 확인
    const { data: existingAd, error: fetchError } = await supabase
      .from('advertisements')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAd) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '광고를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 5. 소프트 삭제 (is_active = false)
    const { error: deleteError } = await supabase
      .from('advertisements')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE /api/admin/ads/[id]] Supabase delete error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '광고 삭제 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '광고가 성공적으로 삭제되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/admin/ads/[id]] Unexpected error:', error);
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
