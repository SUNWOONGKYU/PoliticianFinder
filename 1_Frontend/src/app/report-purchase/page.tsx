'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// 가격 정책 (부가세 별도)
const BASE_PRICE = 1000000; // 100만원
const VAT_RATE = 0.1; // 10%

// 구매 회차별 가격 (부가세 별도)
const getPriceByPurchaseCount = (count: number): number => {
  if (count <= 1) return 1000000; // 1차: 100만원
  if (count === 2) return 900000;  // 2차: 90만원
  if (count === 3) return 800000;  // 3차: 80만원
  if (count === 4) return 700000;  // 4차: 70만원
  if (count === 5) return 600000;  // 5차: 60만원
  return 500000; // 6차 이후: 50만원 (최소가)
};

// 계좌 정보
const BANK_INFO = {
  bank: '하나은행',
  account: '287-910921-40507',
  holder: '파인더월드',
};

type Step = 'info' | 'verify' | 'payment' | 'complete';

export default function ReportPurchasePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const politicianId = searchParams.get('politician_id');
  const politicianName = searchParams.get('name') || '';

  const [step, setStep] = useState<Step>('info');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // 구매자 정보
  const [buyerName, setBuyerName] = useState('');
  const [depositorName, setDepositorName] = useState('');

  // 구매 회차 (API에서 가져옴)
  const [purchaseCount, setPurchaseCount] = useState(1);
  const [loadingPurchaseCount, setLoadingPurchaseCount] = useState(true);

  // 가격 계산
  const basePrice = getPriceByPurchaseCount(purchaseCount);
  const vatAmount = Math.round(basePrice * VAT_RATE);
  const totalAmount = basePrice + vatAmount;

  // 구매 회차 조회
  useEffect(() => {
    const fetchPurchaseCount = async () => {
      if (!politicianId) return;

      try {
        const response = await fetch(`/api/report-purchase/count?politician_id=${politicianId}`);
        const result = await response.json();
        if (result.success) {
          setPurchaseCount(result.purchase_count + 1); // 다음 구매 회차
        }
      } catch (err) {
        console.error('Failed to fetch purchase count:', err);
      } finally {
        setLoadingPurchaseCount(false);
      }
    };

    fetchPurchaseCount();
  }, [politicianId]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 인증 코드 발송
  const sendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/report-purchase/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: politicianId,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '인증 코드 발송에 실패했습니다.');
      }

      setVerificationId(result.verification_id);
      setCountdown(600); // 10분
      alert('인증 코드가 이메일로 발송되었습니다.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    if (!verificationId) {
      setError('인증 코드를 먼저 발송해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/report-purchase/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: verificationId,
          code: verificationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '인증에 실패했습니다.');
      }

      setIsVerified(true);
      setStep('payment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 구매 신청 제출
  const submitPurchase = async () => {
    if (!buyerName) {
      setError('구매자명을 입력해주세요.');
      return;
    }
    if (!depositorName) {
      setError('입금자명을 입력해주세요.');
      return;
    }
    if (!verificationId) {
      setError('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/report-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: verificationId,
          politician_id: politicianId,
          buyer_name: buyerName,
          buyer_email: email,
          depositor_name: depositorName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '구매 신청에 실패했습니다.');
      }

      setPurchaseId(result.purchase.id);
      setOrderNumber(result.purchase.order_number);
      setStep('complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 정치인 ID 없으면 에러
  if (!politicianId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류</h1>
          <p className="text-gray-600 mb-4">정치인 정보가 없습니다.</p>
          <button
            onClick={() => router.push('/politicians')}
            className="px-6 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            정치인 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 통합 평가 보고서 구매
          </h1>
          <p className="text-gray-600">
            {politicianName || '정치인'} - 4개 AI 통합 평가 보고서
          </p>
        </div>

        {/* 단계 표시 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['상품 확인', '이메일 인증', '결제 정보', '완료'].map((label, idx) => {
              const stepNum = idx + 1;
              const currentStepNum = step === 'info' ? 1 : step === 'verify' ? 2 : step === 'payment' ? 3 : 4;
              const isActive = stepNum === currentStepNum;
              const isCompleted = stepNum < currentStepNum;

              return (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-primary-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {idx < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step 1: 상품 확인 */}
        {step === 'info' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">AI 통합 평가 보고서</h2>

            {/* 상품 설명 */}
            <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl mr-4">
                  📊
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">4개 AI 통합 평가 보고서</h3>
                  <p className="text-gray-600">Claude, ChatGPT, Gemini, Grok 평가 종합</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Claude AI 상세 평가 분석</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>ChatGPT AI 상세 평가 분석</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Gemini AI 상세 평가 분석</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Grok AI 상세 평가 분석</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary-500 mr-2">★</span>
                  <span className="font-medium">4개 AI 종합 평가 및 비교 분석</span>
                </div>
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="border-2 border-primary-200 rounded-lg p-6 mb-6 bg-primary-50">
              <h3 className="font-bold text-lg mb-4 text-primary-800">가격 안내</h3>

              {loadingPurchaseCount ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">가격 정보 로딩 중...</p>
                </div>
              ) : (
                <>
                  {/* 구매 회차 표시 */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">구매 회차</span>
                      <span className="text-xl font-bold text-primary-600">{purchaseCount}차 구매</span>
                    </div>
                    {purchaseCount > 1 && (
                      <p className="text-sm text-green-600 mt-2">
                        🎉 {purchaseCount}차 구매 할인이 적용됩니다!
                      </p>
                    )}
                  </div>

                  {/* 가격 상세 */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>보고서 가격 (부가세 별도)</span>
                      <span>₩{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>부가세 (10%)</span>
                      <span>₩{vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-xl font-bold">
                      <span>총 결제 금액</span>
                      <span className="text-primary-600">₩{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 할인 정책 안내 */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-2">💡 구매 회차별 할인 정책</p>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <p>1차: 100만원 → 2차: 90만원 → 3차: 80만원</p>
                      <p>4차: 70만원 → 5차: 60만원 → 6차 이후: 50만원</p>
                      <p className="text-yellow-600">(모든 가격 부가세 별도)</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setStep('verify')}
              disabled={loadingPurchaseCount}
              className={`w-full py-3 rounded-lg font-medium transition
                ${!loadingPurchaseCount
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              다음: 이메일 인증
            </button>
          </div>
        )}

        {/* Step 2: 이메일 인증 */}
        {step === 'verify' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">이메일 인증</h2>
            <p className="text-gray-600 mb-6">
              본인 확인을 위해 이메일로 인증 코드를 발송합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 주소
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={countdown > 0}
                  />
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading || countdown > 0}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap
                      ${countdown > 0
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-primary-500 text-white hover:bg-primary-600'}`}
                  >
                    {countdown > 0
                      ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
                      : '인증 코드 발송'}
                  </button>
                </div>
              </div>

              {countdown > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인증 코드 (6자리)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                    />
                    <button
                      onClick={verifyCode}
                      disabled={loading || verificationCode.length !== 6}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('info')}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 결제 정보 */}
        {step === 'payment' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">결제 정보</h2>

            {/* 인증 완료 표시 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-green-700">
                <span className="text-xl mr-2">✓</span>
                <span>이메일 인증이 완료되었습니다.</span>
              </div>
              <div className="text-sm text-green-600 mt-1">{email}</div>
            </div>

            {/* 구매자 정보 입력 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구매자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="홍길동 (계좌에 표시될 이름)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">실제 입금 시 표시될 이름과 동일하게 입력해주세요.</p>
              </div>
            </div>

            {/* 주문 요약 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">주문 내역</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>AI 통합 평가 보고서 ({purchaseCount}차 구매)</span>
                  <span>₩{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>부가세 (10%)</span>
                  <span>₩{vatAmount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>총 결제 금액</span>
                  <span className="text-primary-600">₩{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div className="border-2 border-primary-200 rounded-lg p-6 mb-6 bg-primary-50">
              <h3 className="font-bold text-lg mb-4 text-primary-800">입금 계좌 안내</h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-20 text-gray-600">은행</span>
                  <span className="font-medium">{BANK_INFO.bank}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-600">계좌번호</span>
                  <span className="font-medium font-mono text-lg">{BANK_INFO.account}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(BANK_INFO.account);
                      alert('계좌번호가 복사되었습니다.');
                    }}
                    className="ml-2 px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    복사
                  </button>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-600">예금주</span>
                  <span className="font-medium">{BANK_INFO.holder}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-gray-600">입금액</span>
                  <span className="font-bold text-primary-600 text-xl">₩{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-primary-700">
                * 입금자명은 위에 입력한 입금자명과 동일하게 입금해주세요.
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('verify')}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={submitPurchase}
                disabled={loading || !buyerName || !depositorName}
                className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:bg-gray-300"
              >
                {loading ? '처리 중...' : '구매 신청 완료'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'complete' && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">구매 신청이 완료되었습니다!</h2>

            {orderNumber && (
              <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block mb-4">
                <span className="text-gray-600">주문번호: </span>
                <span className="font-mono font-bold">{orderNumber}</span>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold mb-3">다음 단계</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
                  <span>아래 계좌로 <strong>₩{totalAmount.toLocaleString()}</strong>을 입금해주세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm mr-3 flex-shrink-0">2</span>
                  <span>입금 확인 후 보고서가 <strong>{email}</strong>으로 발송됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm mr-3 flex-shrink-0">3</span>
                  <span>영업일 기준 1-2일 내 발송됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm mr-3 flex-shrink-0">4</span>
                  <span>세금계산서가 필요하시면 고객센터를 통해 요청해주세요.</span>
                </li>
              </ol>
            </div>

            <div className="border-2 border-primary-200 rounded-lg p-4 mb-6 bg-primary-50">
              <div className="font-bold text-primary-800 mb-2">입금 계좌</div>
              <div className="font-mono text-lg">{BANK_INFO.bank} {BANK_INFO.account}</div>
              <div className="text-gray-600">예금주: {BANK_INFO.holder}</div>
              <div className="mt-2 text-sm text-gray-500">
                입금자명: <span className="font-medium">{depositorName}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/politicians/${politicianId}`)}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              정치인 페이지로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
