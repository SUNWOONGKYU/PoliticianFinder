// P4BA17: 결제 취소 API
// 토스페이먼츠 결제 취소 처리

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TossPaymentClient } from '@/lib/payment/toss-client';
import { z } from 'zod';

/**
 * 결제 취소 요청 스키마
 */
const cancelSchema = z.object({
  cancelReason: z.string().min(1, { message: '취소 사유를 입력해주세요' }),
  cancelAmount: z.number().positive().optional(),
});

/**
 * POST /api/payments/[id]/cancel
 * 결제 취소 요청
 *
 * @description 완료된 결제를 취소합니다.
 *
 * Path Parameters:
 * - id: 주문 ID
 *
 * Request Body:
 * - cancelReason: 취소 사유
 * - cancelAmount: 취소 금액 (선택, 부분 취소 시)
 *
 * Response:
 * - success: 성공 여부
 * - message: 결과 메시지
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const orderId = params.id;

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
    const validated = cancelSchema.parse(body);
    const { cancelReason, cancelAmount } = validated;

    // 3. 주문 정보 조회 및 권한 확인
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

    // 4. 취소 가능 상태 확인
    if (existingPayment.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `취소할 수 없는 상태입니다 (현재 상태: ${existingPayment.status})`,
        },
        { status: 400 }
      );
    }

    // 5. 이미 환불된 주문 확인
    if (existingPayment.refunded_at) {
      return NextResponse.json(
        { success: false, error: '이미 환불된 주문입니다' },
        { status: 400 }
      );
    }

    // 6. paymentKey 확인
    const paymentKey = existingPayment.transaction_id;
    if (!paymentKey) {
      return NextResponse.json(
        { success: false, error: '결제 키를 찾을 수 없습니다' },
        { status: 400 }
      );
    }

    try {
      // 7. 토스페이먼츠 취소 API 호출
      const tossClient = new TossPaymentClient();
      const cancelResult = await tossClient.cancelPayment(
        paymentKey,
        cancelReason,
        cancelAmount
      );

      // 8. payments 테이블 업데이트
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          metadata: {
            ...existingPayment.metadata,
            cancel_reason: cancelReason,
            cancel_amount: cancelAmount,
            cancel_result: cancelResult,
            canceled_at: cancelResult.canceledAt,
          },
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('결제 취소 정보 업데이트 오류:', updateError);
        throw new Error('결제 취소 정보 업데이트에 실패했습니다');
      }

      return NextResponse.json(
        {
          success: true,
          message: '결제가 취소되었습니다',
          data: {
            orderId,
            status: 'refunded',
            canceledAt: cancelResult.canceledAt,
          },
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('결제 취소 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || '결제 취소에 실패했습니다',
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

    console.error('POST /api/payments/[id]/cancel error:', error);
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
