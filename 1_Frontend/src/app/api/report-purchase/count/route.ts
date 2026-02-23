// 구매 회차 조회 API
// GET /api/report-purchase/count?buyer_email=xxx

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const buyerEmail = searchParams.get('buyer_email');

    if (!buyerEmail) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_PARAM', message: 'buyer_email 파라미터가 필요합니다.' }
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 해당 구매자의 완료된 구매 횟수 조회 (buyer_email 기준)
    const { data: purchases, error } = await supabase
      .from('report_purchases')
      .select('id')
      .eq('buyer_email', buyerEmail)
      .eq('payment_confirmed', true);

    if (error) {
      console.error('[count] Database error:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '조회 실패' }
      }, { status: 500 });
    }

    const purchaseCount = purchases?.length || 0;

    return NextResponse.json({
      success: true,
      buyer_email: buyerEmail,
      purchase_count: purchaseCount,
    });

  } catch (error) {
    console.error('[count] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' }
    }, { status: 500 });
  }
}
