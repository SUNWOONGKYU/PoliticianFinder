// P4BA9: Advertisement Management API - List & Create
// Admin-only endpoints for managing advertisements

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/helpers';
import { isValidPlacement } from '@/lib/ads/placement-manager';

const createAdSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 최대 100자까지 입력 가능합니다'),
  image_url: z.string().url('올바른 이미지 URL을 입력해주세요'),
  link_url: z.string().url('올바른 링크 URL을 입력해주세요'),
  placement: z.enum(['main', 'sidebar', 'post_top', 'post_bottom'], {
    errorMap: () => ({ message: '올바른 노출 위치를 선택해주세요' }),
  }),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '올바른 시작일을 입력해주세요',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '올바른 종료일을 입력해주세요',
  }),
  is_active: z.boolean().optional().default(true),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: '종료일은 시작일보다 이후여야 합니다',
    path: ['end_date'],
  }
);

const getAdsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number).refine(
    (val) => val >= 1 && val <= 100,
    '페이지당 항목 수는 1-100 사이여야 합니다'
  ),
  placement: z.string().optional(),
  is_active: z.string().optional(),
  sort: z.string().optional().default('-created_at'),
});

/**
 * GET /api/admin/ads
 * 광고 목록 조회 (관리자 전용)
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
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      placement: searchParams.get('placement') || undefined,
      is_active: searchParams.get('is_active') || undefined,
      sort: searchParams.get('sort') || '-created_at',
    };

    const query = getAdsQuerySchema.parse(queryParams);

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 쿼리 빌더 시작
    let queryBuilder = supabase
      .from('advertisements')
      .select('*', { count: 'exact' });

    // 5. 필터 적용
    if (query.placement && isValidPlacement(query.placement)) {
      queryBuilder = queryBuilder.eq('placement', query.placement);
    }

    if (query.is_active !== undefined) {
      const isActive = query.is_active === 'true';
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }

    // 6. 정렬 적용
    const sortKey = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
    const isDescending = query.sort.startsWith('-');
    queryBuilder = queryBuilder.order(sortKey as any, { ascending: !isDescending });

    // 7. 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 8. 데이터 가져오기
    const { data: ads, count, error } = await queryBuilder;

    if (error) {
      console.error('[GET /api/admin/ads] Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '광고 목록 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: ads || [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
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

    console.error('[GET /api/admin/ads] Unexpected error:', error);
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
 * POST /api/admin/ads
 * 광고 등록 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 2. 요청 데이터 검증
    const body = await request.json();
    const validated = createAdSchema.parse(body);

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 광고 삽입
    const { data: newAd, error } = await supabase
      .from('advertisements')
      .insert({
        title: validated.title,
        image_url: validated.image_url,
        link_url: validated.link_url,
        placement: validated.placement,
        start_date: validated.start_date,
        end_date: validated.end_date,
        is_active: validated.is_active,
        impressions: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/ads] Supabase insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '광고 등록 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newAd,
        message: '광고가 성공적으로 등록되었습니다.',
      },
      { status: 201 }
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

    console.error('[POST /api/admin/ads] Unexpected error:', error);
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