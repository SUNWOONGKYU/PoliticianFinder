// P4BA17: 결제 이력 조회 API
// 사용자별 결제 내역 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/payments/history
 * 결제 이력 조회
 *
 * @description 로그인한 사용자의 결제 내역을 조회합니다.
 *
 * Query Parameters:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 항목 수 (기본값: 20)
 * - status: 결제 상태 필터 (pending, completed, failed, cancelled, refunded)
 * - politician_id: 특정 정치인의 결제만 조회
 *
 * Response:
 * - success: 성공 여부
 * - data: 결제 내역 배열
 * - pagination: 페이지네이션 정보
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const politician_id = searchParams.get('politician_id');

    // 3. 쿼리 빌드
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 상태 필터
    if (status && ['pending', 'completed', 'failed', 'cancelled', 'refunded'].includes(status)) {
      query = query.eq('status', status);
    }

    // 정치인 필터
    if (politician_id) {
      query = query.filter('metadata->>politician_id', 'eq', politician_id);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    // 4. 쿼리 실행
    const { data: payments, count, error } = await query;

    if (error) {
      console.error('결제 이력 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '결제 이력 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 5. 응답 데이터 가공
    const formattedPayments = (payments || []).map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.payment_method,
      description: payment.description,
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
      refunded_at: payment.refunded_at,
      politician_id: payment.metadata?.politician_id,
      politician_name: payment.metadata?.politician_name,
      evaluators: payment.metadata?.evaluators,
      purchased_all: payment.metadata?.purchased_all,
    }));

    // 6. 페이지네이션 정보
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/payments/history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
