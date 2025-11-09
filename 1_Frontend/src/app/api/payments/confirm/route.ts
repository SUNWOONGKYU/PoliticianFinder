// P4BA17: 결제 승인 API
// 토스페이먼츠 결제 승인 처리

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TossPaymentClient } from '@/lib/payment/toss-client';
import { z } from 'zod';

/**
 * 결제 승인 요청 스키마
 */
const confirmSchema = z.object({
  paymentKey: z.string().min(1, { message: '결제 키가 필요합니다' }),
  orderId: z.string().min(1, { message: '주문 ID가 필요합니다' }),
  amount: z.number().positive({ message: '결제 금액은 양수여야 합니다' }),
});

/**
 * POST /api/payments/confirm
 * 결제 승인 처리
 *
 * @description 토스페이먼츠 결제 승인 API를 호출하고 결제 내역을 업데이트합니다.
 *
 * Request Body:
 * - paymentKey: 토스페이먼츠 결제 키
 * - orderId: 주문 ID
 * - amount: 결제 금액
 *
 * Response:
 * - success: 성공 여부
 * - message: 결과 메시지
 * - payment: 결제 정보 (성공 시)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 검증
    const body = await request.json();
    const validated = confirmSchema.parse(body);
    const { paymentKey, orderId, amount } = validated;

    // 3. 주문 정보 조회 및 검증
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPayment) {
      return NextResponse.json(
        { success: false, error: '주문 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. 주문 상태 확인
    if (existingPayment.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `이미 처리된 주문입니다 (상태: ${existingPayment.status})`,
        },
        { status: 400 }
      );
    }

    // 5. 금액 검증 (서버에서 계산한 금액과 일치하는지 확인)
    if (existingPayment.amount !== amount) {
      // 금액 불일치 시 failed 상태로 업데이트
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            ...existingPayment.metadata,
            error: 'Amount mismatch',
            expected: existingPayment.amount,
            received: amount,
          },
        })
        .eq('id', orderId);

      return NextResponse.json(
        {
          success: false,
          error: '결제 금액이 일치하지 않습니다',
        },
        { status: 400 }
      );
    }

    try {
      // 6. 토스페이먼츠 승인 API 호출
      const tossClient = new TossPaymentClient();
      const payment = await tossClient.confirmPayment(paymentKey, orderId, amount);

      // 7. payments 테이블 업데이트
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: paymentKey,
          paid_at: new Date().toISOString(),
          metadata: {
            ...existingPayment.metadata,
            toss_data: payment,
            approved_at: payment.approvedAt,
            payment_method_detail: payment.method,
            card_info: payment.card ? {
              company: payment.card.company,
              number: payment.card.number,
              approve_no: payment.card.approveNo,
            } : null,
          },
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error('결제 정보 업데이트 오류:', updateError);
        throw new Error('결제 정보 업데이트에 실패했습니다');
      }

      return NextResponse.json(
        {
          success: true,
          message: '결제가 완료되었습니다',
          payment: updatedPayment,
        },
        { status: 200 }
      );
    } catch (error: any) {
      // 8. 에러 처리 - failed 상태로 업데이트
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            ...existingPayment.metadata,
            error: error.message,
            error_timestamp: new Date().toISOString(),
          },
        })
        .eq('id', orderId);

      return NextResponse.json(
        {
          success: false,
          error: error.message || '결제 승인에 실패했습니다',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청입니다',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('POST /api/payments/confirm error:', error);
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
