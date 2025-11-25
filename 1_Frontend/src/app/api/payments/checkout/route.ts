// P4BA17: 결제 요청 API
// 토스페이먼츠 결제 요청 및 주문 생성

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePaymentAmount, type AIEvaluator } from '@/lib/payment/toss-client';
import { z } from 'zod';

/**
 * 결제 요청 스키마
 */
const checkoutSchema = z.object({
  politician_id: z.string().uuid({ message: '유효하지 않은 정치인 ID입니다' }),
  evaluators: z.array(
    z.enum(['claude', 'chatgpt', 'gemini', 'grok', 'perplexity', 'all'])
  ).min(1, { message: '최소 1개의 AI 모델을 선택해야 합니다' }),
});

/**
 * POST /api/payments/checkout
 * 결제 요청 생성
 *
 * @description AI 평가 리포트 구매를 위한 결제 주문을 생성합니다.
 *
 * Request Body:
 * - politician_id: 정치인 ID (UUID)
 * - evaluators: AI 모델 목록 (claude, chatgpt, gemini, grok, perplexity, all)
 *
 * Response:
 * - success: 성공 여부
 * - order_id: 주문 ID
 * - amount: 결제 금액
 * - order_name: 주문명
 * - customer_email: 고객 이메일
 * - customer_name: 고객 이름
 */
export async function POST(request: NextRequest) {
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

    // 2. 요청 데이터 검증
    const body = await request.json();
    const validated = checkoutSchema.parse(body);
    const { politician_id, evaluators } = validated;

    // 3. 정치인 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. 결제 금액 계산
    const amount = calculatePaymentAmount(evaluators as AIEvaluator[]);

    // 5. 주문 ID 생성 (고유 ID)
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // 6. 주문명 생성
    let orderName: string;
    if (evaluators.includes('all')) {
      orderName = `${politician.name} - 전체 AI 평가 리포트`;
    } else if (evaluators.length === 1) {
      const modelNames: Record<string, string> = {
        claude: 'Claude',
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        grok: 'Grok',
        perplexity: 'Perplexity',
      };
      const modelName = modelNames[evaluators[0]] || evaluators[0];
      orderName = `${politician.name} - ${modelName} 평가 리포트`;
    } else {
      orderName = `${politician.name} - AI 평가 리포트 (${evaluators.length}개)`;
    }

    // 7. payments 테이블에 임시 저장
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        id: orderId,
        user_id: user.id,
        amount,
        currency: 'KRW',
        payment_method: 'toss',
        pg_provider: 'toss',
        status: 'pending',
        purpose: 'ai_evaluation_report',
        description: orderName,
        metadata: {
          politician_id,
          politician_name: politician.name,
          evaluators,
          purchased_all: evaluators.includes('all'),
        },
      });

    if (insertError) {
      console.error('결제 주문 생성 오류:', insertError);
      return NextResponse.json(
        { success: false, error: '결제 주문 생성 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 8. 응답
    return NextResponse.json(
      {
        success: true,
        order_id: orderId,
        amount,
        order_name: orderName,
        customer_email: user.email || '',
        customer_name: user.user_metadata?.name || user.email?.split('@')[0] || '고객',
      },
      { status: 201 }
    );
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

    console.error('POST /api/payments/checkout error:', error);
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
