// P4BA17: 토스페이먼츠 클라이언트
// 토스페이먼츠 API를 통합하여 결제 요청, 승인, 취소 처리

/**
 * 토스페이먼츠 API 클라이언트
 * @description 토스페이먼츠 결제 시스템과의 통신을 담당하는 클라이언트 클래스
 */
export class TossPaymentClient {
  private clientKey: string;
  private secretKey: string;
  private baseURL: string = 'https://api.tosspayments.com/v1';

  constructor() {
    this.clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
    this.secretKey = process.env.TOSS_SECRET_KEY || '';
  }

  /**
   * API 키가 설정되어 있는지 확인
   */
  private hasValidKeys(): boolean {
    return Boolean(this.clientKey && this.secretKey);
  }

  /**
   * 결제 승인 요청
   * @param paymentKey 토스페이먼츠 결제 키
   * @param orderId 주문 ID
   * @param amount 결제 금액
   * @returns 결제 승인 결과
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number
  ): Promise<TossPaymentConfirmResponse> {
    // Mock 모드: API 키가 없으면 Mock 응답 반환
    if (!this.hasValidKeys()) {
      return this.mockConfirmPayment(paymentKey, orderId, amount);
    }

    try {
      const response = await fetch(`${this.baseURL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '결제 승인에 실패했습니다');
      }

      return await response.json();
    } catch (error) {
      console.error('토스페이먼츠 승인 오류:', error);
      throw error;
    }
  }

  /**
   * 결제 취소 요청
   * @param paymentKey 토스페이먼츠 결제 키
   * @param cancelReason 취소 사유
   * @param cancelAmount 취소 금액 (선택, 부분 취소 시)
   * @returns 결제 취소 결과
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number
  ): Promise<TossPaymentCancelResponse> {
    // Mock 모드: API 키가 없으면 Mock 응답 반환
    if (!this.hasValidKeys()) {
      return this.mockCancelPayment(paymentKey, cancelReason, cancelAmount);
    }

    try {
      const body: any = { cancelReason };
      if (cancelAmount) {
        body.cancelAmount = cancelAmount;
      }

      const response = await fetch(`${this.baseURL}/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '결제 취소에 실패했습니다');
      }

      return await response.json();
    } catch (error) {
      console.error('토스페이먼츠 취소 오류:', error);
      throw error;
    }
  }

  /**
   * 결제 정보 조회
   * @param paymentKey 토스페이먼츠 결제 키
   * @returns 결제 정보
   */
  async getPayment(paymentKey: string): Promise<TossPaymentConfirmResponse> {
    // Mock 모드: API 키가 없으면 Mock 응답 반환
    if (!this.hasValidKeys()) {
      return this.mockGetPayment(paymentKey);
    }

    try {
      const response = await fetch(`${this.baseURL}/payments/${paymentKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '결제 정보 조회에 실패했습니다');
      }

      return await response.json();
    } catch (error) {
      console.error('토스페이먼츠 조회 오류:', error);
      throw error;
    }
  }

  /**
   * Mock: 결제 승인
   */
  private mockConfirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number
  ): TossPaymentConfirmResponse {
    console.warn('⚠️ Mock 모드: 실제 API 키가 설정되지 않아 Mock 응답을 반환합니다.');
    return {
      paymentKey,
      orderId,
      amount,
      status: 'DONE',
      approvedAt: new Date().toISOString(),
      method: 'CARD',
      totalAmount: amount,
      balanceAmount: amount,
      suppliedAmount: Math.floor(amount / 1.1),
      vat: amount - Math.floor(amount / 1.1),
      useEscrow: false,
      cultureExpense: false,
      card: {
        company: '신한',
        number: '1234****5678',
        installmentPlanMonths: 0,
        isInterestFree: false,
        approveNo: 'MOCK_' + Date.now(),
        useCardPoint: false,
        cardType: 'CREDIT',
        ownerType: 'PERSONAL',
        acquireStatus: 'READY',
      },
    };
  }

  /**
   * Mock: 결제 취소
   */
  private mockCancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number
  ): TossPaymentCancelResponse {
    console.warn('⚠️ Mock 모드: 실제 API 키가 설정되지 않아 Mock 응답을 반환합니다.');
    return {
      paymentKey,
      orderId: 'MOCK_ORDER_' + Date.now(),
      status: 'CANCELED',
      canceledAt: new Date().toISOString(),
      cancels: [
        {
          cancelAmount: cancelAmount || 0,
          cancelReason,
          canceledAt: new Date().toISOString(),
          transactionKey: 'MOCK_TX_' + Date.now(),
        },
      ],
    };
  }

  /**
   * Mock: 결제 정보 조회
   */
  private mockGetPayment(paymentKey: string): TossPaymentConfirmResponse {
    console.warn('⚠️ Mock 모드: 실제 API 키가 설정되지 않아 Mock 응답을 반환합니다.');
    return {
      paymentKey,
      orderId: 'MOCK_ORDER_' + Date.now(),
      amount: 500000,
      status: 'DONE',
      approvedAt: new Date().toISOString(),
      method: 'CARD',
      totalAmount: 500000,
      balanceAmount: 500000,
      suppliedAmount: Math.floor(500000 / 1.1),
      vat: 500000 - Math.floor(500000 / 1.1),
      useEscrow: false,
      cultureExpense: false,
    };
  }
}

/**
 * 토스페이먼츠 결제 승인 응답 타입
 */
export interface TossPaymentConfirmResponse {
  paymentKey: string;
  orderId: string;
  amount: number;
  status: string;
  approvedAt: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  useEscrow: boolean;
  cultureExpense: boolean;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
  };
}

/**
 * 토스페이먼츠 결제 취소 응답 타입
 */
export interface TossPaymentCancelResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  canceledAt: string;
  cancels: Array<{
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
    transactionKey: string;
  }>;
}

/**
 * AI 평가 모델 타입
 */
export type AIEvaluator = 'claude' | 'chatgpt' | 'gemini' | 'grok' | 'perplexity' | 'all';

/**
 * 결제 금액 계산
 * @param evaluators 평가 모델 목록
 * @returns 결제 금액
 */
export function calculatePaymentAmount(evaluators: AIEvaluator[]): number {
  const INDIVIDUAL_PRICE = 500000; // ₩500,000 per AI model
  const BUNDLE_PRICE = 2500000; // ₩2,500,000 for all 5 models

  if (evaluators.includes('all')) {
    return BUNDLE_PRICE;
  }

  return evaluators.length * INDIVIDUAL_PRICE;
}
