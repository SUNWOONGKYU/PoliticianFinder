'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

interface VerifyForm {
  name: string;
  party: string;
  position: string;
}

const VALID_POLITICIANS = [
  { name: '김민준', party: '더불어민주당', position: '국회의원' },
  { name: '이서연', party: '국민의힘', position: '광역단체장' },
  { name: '박준서', party: '정의당', position: '현직' },
];

const PARTIES = [
  '더불어민주당',
  '국민의힘',
  '조국혁신당',
  '개혁신당',
  '진보당',
  '새로운미래',
  '기본소득당',
  '사회민주당',
  '정의당',
  '무소속',
  '기타',
];

const POSITIONS = [
  '국회의원',
  '광역단체장',
  '광역의원',
  '기초단체장',
  '기초의원',
  '교육감',
  '현직',
];

export default function PaymentPage() {
  const [verifyForm, setVerifyForm] = useState<VerifyForm>({
    name: '',
    party: '',
    position: '',
  });

  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeItems, setAgreeItems] = useState([false, false]);
  const [paymentMethod] = useState('transfer');
  const [alert, setAlert] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState<'service' | 'privacy'>('service');

  const handleVerifyChange = (field: keyof VerifyForm, value: string) => {
    setVerifyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVerify = () => {
    if (!verifyForm.name || !verifyForm.party || !verifyForm.position) {
      showAlert('모든 정보를 입력해주세요.');
      return;
    }

    const isValid = VALID_POLITICIANS.some(
      (p) =>
        p.name === verifyForm.name &&
        p.party === verifyForm.party &&
        p.position === verifyForm.position
    );

    if (isValid) {
      setIsVerified(true);
      setVerifyError(false);
    } else {
      setIsVerified(false);
      setVerifyError(true);
    }
  };

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeItems([checked, checked]);
  };

  const handleAgreeItem = (index: number, checked: boolean) => {
    const newItems = [...agreeItems];
    newItems[index] = checked;
    setAgreeItems(newItems);
    setAgreeAll(newItems.every((item) => item));
  };

  const handlePayment = () => {
    if (!isVerified) return;
    window.location.href = '/account-transfer';
  };

  const showAlert = (message: string) => {
    setAlert({ message, visible: true });
  };

  const closeAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const isPaymentEnabled = useMemo(() => {
    return isVerified && agreeItems[0] && agreeItems[1];
  }, [isVerified, agreeItems]);

  const getServiceTerms = () => {
    return `
      <div class="space-y-6 text-gray-700">
        <h3 class="font-bold text-lg">제1조 (목적)</h3>
        <p>본 약관은 PoliticianFinder(이하 "서비스")가 제공하는 정치인 평가 플랫폼 서비스의 이용과 관련하여 회원과 서비스 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

        <h3 class="font-bold text-lg">제2조 (정의)</h3>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>"서비스"</strong>란 PoliticianFinder가 제공하는 정치인 평가 및 비교 플랫폼을 의미합니다.</li>
          <li><strong>"회원"</strong>이란 본 약관에 동의하고 서비스에 가입하여 서비스를 이용하는 자를 의미합니다.</li>
          <li><strong>"정치인"</strong>이란 선거에 출마하거나 현직 공직자로서 본 서비스의 평가 대상이 되는 자를 의미합니다.</li>
          <li><strong>"AI 평가"</strong>란 인공지능 기술을 활용하여 정치인의 활동, 공약 이행률, 발언 등을 분석하고 평가하는 것을 의미합니다.</li>
        </ul>

        <div class="mt-8 pt-6 border-t text-center">
          <p class="font-bold text-gray-900">시행일자: 2025년 11월 1일</p>
        </div>
      </div>
    `;
  };

  const getPrivacyTerms = () => {
    return `
      <div class="space-y-6 text-gray-700">
        <h3 class="font-bold text-lg">1. 수집하는 개인정보 항목</h3>
        <p class="font-semibold">가. 필수 수집 항목</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>이름, 이메일 주소, 비밀번호, 휴대폰 번호</li>
          <li>정치인 회원의 경우: 소속 정당, 출마 직종/지역</li>
        </ul>

        <h3 class="font-bold text-lg">2. 개인정보의 수집 및 이용 목적</h3>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>회원 관리:</strong> 회원가입 의사 확인, 본인 인증, 부정 이용 방지</li>
          <li><strong>서비스 제공:</strong> 정치인 평가 서비스, 커뮤니티 운영, 맞춤형 콘텐츠 제공</li>
        </ul>

        <div class="mt-8 pt-6 border-t text-center">
          <p class="font-bold text-gray-900">시행일자: 2025년 11월 1일</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Payment Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">주문자 정보</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value="김민준"
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value="politician@example.com"
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    휴대폰 번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value="010-1234-5678"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Identity Verification */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">본인 인증</h2>
              <p className="text-sm text-gray-600 mb-4">
                정치인 정치인 AI 상세평가보고서는 해당 정치인 본인만 구매할 수 있습니다. 본인 확인을 위해 인증이
                필요합니다.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={verifyForm.name}
                    onChange={(e) => handleVerifyChange('name', e.target.value)}
                    placeholder="정치인 이름"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    소속 정당 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={verifyForm.party}
                    onChange={(e) => handleVerifyChange('party', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">선택하세요</option>
                    {PARTIES.map((party) => (
                      <option key={party} value={party}>
                        {party}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    출마직종 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={verifyForm.position}
                    onChange={(e) => handleVerifyChange('position', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">선택하세요</option>
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleVerify}
                  className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  본인 인증하기
                </button>

                {isVerified && !verifyError && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="font-bold">본인 인증이 완료되었습니다.</span>
                    </div>
                  </div>
                )}

                {verifyError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="font-bold">
                        본인 인증에 실패했습니다. 정보를 다시 확인해주세요.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">결제 수단</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input type="radio" name="payment-method" value="transfer" checked readOnly className="w-4 h-4 text-primary-600" />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        ></path>
                      </svg>
                      <span className="font-medium text-gray-900">계좌이체</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">약관 동의</h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="font-bold text-gray-900">전체 동의</span>
                </label>
                <hr />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeItems[0]}
                    onChange={(e) => handleAgreeItem(0, e.target.checked)}
                    className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">
                    <span className="text-red-500">[필수]</span> 이용약관 동의
                    <button
                      type="button"
                      onClick={() => {
                        setTermsType('service');
                        setShowTermsModal(true);
                      }}
                      className="text-primary-600 hover:underline ml-1"
                    >
                      보기
                    </button>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeItems[1]}
                    onChange={(e) => handleAgreeItem(1, e.target.checked)}
                    className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">
                    <span className="text-red-500">[필수]</span> 개인정보 수집 및 이용 동의
                    <button
                      type="button"
                      onClick={() => {
                        setTermsType('privacy');
                        setShowTermsModal(true);
                      }}
                      className="text-primary-600 hover:underline ml-1"
                    >
                      보기
                    </button>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">주문 정보</h2>

              {/* Product Information */}
              <div className="mb-6">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">정치인 정치인 AI 상세평가보고서</h3>
                    <p className="text-sm text-gray-600">김민준 의원</p>
                    <p className="text-sm text-gray-500">더불어민주당 · 서울 강남구</p>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>상품 금액</span>
                  <span className="font-medium">500,000원</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>할인</span>
                  <span className="font-medium text-red-600">-0원</span>
                </div>
              </div>

              {/* Final Payment Amount */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">최종 결제 금액</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">500,000원</div>
                    <div className="text-sm text-gray-500">부가세 포함</div>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={!isPaymentEnabled}
                className={`w-full px-6 py-4 rounded-lg font-bold text-lg ${
                  isPaymentEnabled
                    ? 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isVerified
                  ? agreeItems[0] && agreeItems[1]
                    ? '500,000원 결제하기'
                    : '500,000원 결제하기'
                  : '본인 인증을 완료해주세요'}
              </button>

              {/* Caution */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-primary-600 mb-2 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  결제 전 확인사항
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 본인 확인이 필요합니다</li>
                  <li>• 보고서는 발행 시점의 평가 내용이 기록됩니다</li>
                  <li>• 결제 후 환불이 불가능합니다</li>
                  <li>• 구매 내역은 정치인 상세페이지에서 확인 가능합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alert Modal */}
      {alert.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">
                {alert.message}
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={closeAlert}
                className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {termsType === 'service' ? '이용약관' : '개인정보 수집 및 이용 동의'}
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            {/* Modal Body */}
            <div
              className="p-6 overflow-y-auto flex-1"
              dangerouslySetInnerHTML={{
                __html:
                  termsType === 'service' ? getServiceTerms() : getPrivacyTerms(),
              }}
            />
            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
