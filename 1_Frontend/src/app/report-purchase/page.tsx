'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/P1F1_AuthContext';

// 가격 정책 (부가세 별도)
const BASE_PRICE = 2000000; // 200만원
const VAT_RATE = 0.1; // 10%

// 구매 회차별 가격 (부가세 별도) - 구매자(buyer_email) 기준
const getPriceByPurchaseCount = (count: number): number => {
  const base = 2000000; // 200만원
  const discount = (count - 1) * 100000; // 회차별 10만원 할인
  return Math.max(base - discount, 1000000); // 최저 100만원
};

// 계좌 정보
const BANK_INFO = {
  bank: '하나은행',
  account: '287-910921-40507',
  holder: '파인더월드',
};

type BuyerType = 'politician' | 'member';
type Step = 'info' | 'verify' | 'payment' | 'complete';

export default function ReportPurchasePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const politicianId = searchParams.get('politician_id');
  const politicianName = searchParams.get('name') || '';
  const urlBuyerType = searchParams.get('buyer_type') as BuyerType | null;

  const [step, setStep] = useState<Step>('info');
  const [buyerType, setBuyerType] = useState<BuyerType | null>(null);
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
  const [loadingPurchaseCount, setLoadingPurchaseCount] = useState(false);

  // 가격 계산
  const basePrice = getPriceByPurchaseCount(purchaseCount);
  const vatAmount = Math.round(basePrice * VAT_RATE);
  const totalAmount = basePrice + vatAmount;

  // 구매 회차 조회 (buyer_email 기준)
  const fetchPurchaseCount = async (buyerEmail: string) => {
    if (!buyerEmail) return;

    setLoadingPurchaseCount(true);
    try {
      const response = await fetch(`/api/report-purchase/count?buyer_email=${encodeURIComponent(buyerEmail)}`);
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

  // URL buyer_type 파라미터로 자동 분기
  useEffect(() => {
    if (!urlBuyerType || buyerType || authLoading) return;

    if (urlBuyerType === 'politician') {
      // PoliticianAuthModal에서 이미 인증했다면 → verify 단계 건너뜀
      const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('politician_session') : null;
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          fetch('/api/politicians/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session),
          })
            .then(res => res.json())
            .then(data => {
              if (data.valid && data.politician?.verified_email) {
                setBuyerType('politician');
                setEmail(data.politician.verified_email);
                setBuyerName(data.politician.name || '');
                setIsVerified(true);
                fetchPurchaseCount(data.politician.verified_email);
                setStep('payment');
              } else {
                handleBuyerTypeSelect('politician');
              }
            })
            .catch(() => handleBuyerTypeSelect('politician'));
        } catch {
          handleBuyerTypeSelect('politician');
        }
      } else {
        handleBuyerTypeSelect('politician');
      }
    } else {
      handleBuyerTypeSelect(urlBuyerType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBuyerType, authLoading]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 구매자 유형 선택 핸들러
  const handleBuyerTypeSelect = (type: BuyerType) => {
    setBuyerType(type);
    setError('');

    if (type === 'member') {
      // 일반 회원: 로그인 확인
      if (authLoading) return; // 아직 로딩 중

      if (!user) {
        // 미로그인 → 로그인 페이지로 리다이렉트
        const currentUrl = `/report-purchase?politician_id=${politicianId}&name=${encodeURIComponent(politicianName)}`;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      // 로그인됨 → 유저 정보 자동 채움 → 바로 결제 정보 단계로
      const userEmail = user.email || '';
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setEmail(userEmail);
      setBuyerName(userName);
      fetchPurchaseCount(userEmail);
      setStep('payment');
    } else {
      // 정치인 본인: 이메일 인증 단계로
      setStep('verify');
    }
  };

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

      // 가격 정보 업데이트
      if (result.purchase_info) {
        setPurchaseCount(result.purchase_info.purchase_count);
      }

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
      // 인증 완료 후 buyer_email 기준 회차 조회
      fetchPurchaseCount(email);
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

    if (buyerType === 'politician' && !verificationId) {
      setError('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    if (buyerType === 'member' && !user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/report-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_type: buyerType,
          verification_id: buyerType === 'politician' ? verificationId : undefined,
          politician_id: politicianId,
          buyer_name: buyerName,
          buyer_email: email,
          depositor_name: depositorName,
          user_id: buyerType === 'member' ? user?.id : undefined,
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

  // 단계 표시 계산
  const getStepLabels = () => {
    if (buyerType === 'member') {
      return ['상품 확인', '결제 정보', '완료'];
    }
    return ['상품 확인', '이메일 인증', '결제 정보', '완료'];
  };

  const getCurrentStepNum = () => {
    if (buyerType === 'member') {
      if (step === 'info') return 1;
      if (step === 'payment') return 2;
      if (step === 'complete') return 3;
      return 1;
    }
    if (step === 'info') return 1;
    if (step === 'verify') return 2;
    if (step === 'payment') return 3;
    if (step === 'complete') return 4;
    return 1;
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

  const stepLabels = getStepLabels();
  const currentStepNum = getCurrentStepNum();

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
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
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
                  {idx < stepLabels.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
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

        {/* Step 1: 상품 확인 + 구매자 유형 선택 */}
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

            {/* 보고서 목차 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-sm font-bold text-gray-800 mb-3">📋 보고서 구성</p>
              <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
                <li>정치인 프로필</li>
                <li>종합 점수 (AI별 최종 점수 + 10개 카테고리 점수 + 편차 분석)</li>
                <li>카테고리별 상세 분석 (10개 분야 x 4개 AI 상세 근거)</li>
                <li>경쟁자 비교</li>
                <li>점수 구조 분석</li>
                <li>평가 방법론 및 한계</li>
                <li>등급 기준표</li>
              </ol>
            </div>

            {/* 가격 정보 */}
            <div className="border-2 border-primary-200 rounded-lg p-6 mb-6 bg-primary-50">
              <h3 className="font-bold text-lg mb-4 text-primary-800">가격 안내</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>보고서 가격 (부가세 별도)</span>
                  <span className="font-bold text-primary-600 text-xl">₩{BASE_PRICE.toLocaleString()}</span>
                </div>
              </div>
              {/* 할인 정책 안내 */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">💡 구매 회차별 할인 정책</p>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>1차: 200만원 → 2차: 190만원 → 3차: 180만원 → ...</p>
                  <p>회차별 10만원 할인, 11차 이후: 100만원 (최저가)</p>
                  <p className="text-yellow-600">(모든 가격 부가세 별도, 구매자 이메일 기준 회차 누적)</p>
                </div>
              </div>
            </div>

            {/* 구매자 유형 선택 */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">구매자 유형을 선택해주세요</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 정치인 본인 */}
                <button
                  onClick={() => handleBuyerTypeSelect('politician')}
                  className={`p-5 border-2 rounded-lg text-left transition hover:shadow-md
                    ${buyerType === 'politician' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <div className="text-2xl mb-2">🏛️</div>
                  <div className="font-bold text-gray-900 mb-1">정치인 본인입니다</div>
                  <p className="text-sm text-gray-600">등록된 이메일로 인증 후 구매</p>
                </button>

                {/* 일반 회원 */}
                <button
                  onClick={() => handleBuyerTypeSelect('member')}
                  disabled={authLoading}
                  className={`p-5 border-2 rounded-lg text-left transition hover:shadow-md
                    ${buyerType === 'member' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}
                    ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-bold text-gray-900 mb-1">일반 회원입니다</div>
                  <p className="text-sm text-gray-600">사이트 회원 로그인으로 구매</p>
                  {authLoading && <p className="text-xs text-gray-400 mt-1">로그인 상태 확인 중...</p>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2A: 이메일 인증 (정치인 전용) */}
        {step === 'verify' && buyerType === 'politician' && (
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
                    인증 코드 (숫자 6자리)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
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
                onClick={() => { setStep('info'); setBuyerType(null); }}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
            </div>
          </div>
        )}

        {/* Step 3 (정치인) / Step 2B (일반 회원): 결제 정보 */}
        {step === 'payment' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">결제 정보</h2>

            {/* 인증 상태 표시 */}
            {buyerType === 'politician' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-green-700">
                  <span className="text-xl mr-2">✓</span>
                  <span>이메일 인증이 완료되었습니다.</span>
                </div>
                <div className="text-sm text-green-600 mt-1">{email}</div>
              </div>
            )}

            {buyerType === 'member' && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-blue-700">
                  <span className="text-xl mr-2">✓</span>
                  <span>회원 로그인 확인 완료</span>
                </div>
                <div className="text-sm text-blue-600 mt-1">{user.email}</div>
              </div>
            )}

            {/* 구매자 정보 입력 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구매자 이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                  disabled={buyerType === 'politician' || (buyerType === 'member' && !!user?.email)}
                />
              </div>
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
              {loadingPurchaseCount ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">가격 정보 로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>AI 통합 평가 보고서 ({purchaseCount}차 구매)</span>
                    <span>₩{basePrice.toLocaleString()}</span>
                  </div>
                  {purchaseCount > 1 && (
                    <div className="flex justify-between text-green-600">
                      <span>회차 할인 ({purchaseCount}차)</span>
                      <span>-₩{(BASE_PRICE - basePrice).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>부가세 (10%)</span>
                    <span>₩{vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>총 결제 금액</span>
                    <span className="text-primary-600">₩{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
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
                onClick={() => {
                  if (buyerType === 'politician') {
                    setStep('verify');
                  } else {
                    setStep('info');
                    setBuyerType(null);
                  }
                }}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={submitPurchase}
                disabled={loading || !buyerName || !depositorName || loadingPurchaseCount}
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
