// P4BA17: 결제 웹훅 처리 API
// 토스페이먼츠 웹훅 이벤트 처리

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 웹훅 이벤트 스키마
 */
const webhookSchema = z.object({
  eventType: z.enum([
    'PAYMENT_COMPLETED',
    'PAYMENT_CANCELED',
    'PAYMENT_FAILED',
  ]),
  data: z.object({
    paymentKey: z.string(),
    orderId: z.string(),
    status: z.string(),
  }),
  createdAt: z.string().optional(),
});

/**
 * POST /api/payments/webhook
 * 토스페이먼츠 웹훅 처리
 *
 * @description 토스페이먼츠로부터 결제 상태 변경 알림을 받아 처리합니다.
 *
 * 웹훅 이벤트:
 * - PAYMENT_COMPLETED: 결제 완료
 * - PAYMENT_CANCELED: 결제 취소
 * - PAYMENT_FAILED: 결제 실패
 *
 * Security:
 * - 웹훅 서명 검증 필요 (프로덕션 환경)
 * - Service Role Key 사용 (RLS 우회)
 */
export async function POST(request: NextRequest) {
  try {
    // Service Role 클라이언트 (RLS 우회)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 웹훅 서명 검증 (보안)
    const signature = request.headers.get('toss-signature');
    // TODO: 프로덕션 환경에서는 서명 검증 필수
    // if (!verifyWebhookSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // 2. 요청 데이터 검증
    const body = await request.json();
    const validated = webhookSchema.parse(body);
    const { eventType, data } = validated;
    const { paymentKey, orderId, status } = data;

    console.log('웹훅 이벤트 수신:', {
      eventType,
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });

    // 3. 주문 정보 조회
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingPayment) {
      console.error('주문 정보 조회 실패:', fetchError);
      return NextResponse.json(
        { success: false, error: '주문 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. 이벤트 타입별 처리
    switch (eventType) {
      case 'PAYMENT_COMPLETED':
        await handlePaymentCompleted(supabase, orderId, paymentKey, existingPayment);
        break;

      case 'PAYMENT_CANCELED':
        await handlePaymentCanceled(supabase, orderId, paymentKey, existingPayment);
        break;

      case 'PAYMENT_FAILED':
        await handlePaymentFailed(supabase, orderId, paymentKey, existingPayment);
        break;

      default:
        console.warn('알 수 없는 웹훅 이벤트:', eventType);
    }

    return NextResponse.json(
      { success: true, message: '웹훅 처리 완료' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 웹훅 데이터입니다',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('POST /api/payments/webhook error:', error);
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

/**
 * 결제 완료 처리
 */
async function handlePaymentCompleted(
  supabase: any,
  orderId: string,
  paymentKey: string,
  existingPayment: any
) {
  // 이미 completed 상태인 경우 중복 처리 방지
  if (existingPayment.status === 'completed') {
    console.log('이미 완료된 결제:', orderId);
    return;
  }

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      transaction_id: paymentKey,
      paid_at: new Date().toISOString(),
      metadata: {
        ...existingPayment.metadata,
        webhook_received_at: new Date().toISOString(),
        webhook_event: 'PAYMENT_COMPLETED',
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('결제 완료 처리 오류:', error);
    throw error;
  }

  console.log('결제 완료 처리 성공:', orderId);
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCanceled(
  supabase: any,
  orderId: string,
  paymentKey: string,
  existingPayment: any
) {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'cancelled',
      transaction_id: paymentKey,
      refunded_at: new Date().toISOString(),
      metadata: {
        ...existingPayment.metadata,
        webhook_received_at: new Date().toISOString(),
        webhook_event: 'PAYMENT_CANCELED',
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('결제 취소 처리 오류:', error);
    throw error;
  }

  console.log('결제 취소 처리 성공:', orderId);
}

/**
 * 결제 실패 처리
 */
async function handlePaymentFailed(
  supabase: any,
  orderId: string,
  paymentKey: string,
  existingPayment: any
) {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      transaction_id: paymentKey,
      metadata: {
        ...existingPayment.metadata,
        webhook_received_at: new Date().toISOString(),
        webhook_event: 'PAYMENT_FAILED',
      },
    })
    .eq('id', orderId);

  if (error) {
    console.error('결제 실패 처리 오류:', error);
    throw error;
  }

  console.log('결제 실패 처리 성공:', orderId);
}

/**
 * 웹훅 서명 검증 (TODO: 프로덕션에서 구현 필요)
 */
function verifyWebhookSignature(signature: string | null, body: any): boolean {
  // TODO: 토스페이먼츠 웹훅 서명 검증 로직 구현
  // HMAC-SHA256을 사용하여 서명 검증
  return true;
}
